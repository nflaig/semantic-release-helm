const AggregateError = require('aggregate-error');
const execa = require('execa');

module.exports = async (pluginConfig, context) => {
    const errors = [];

    const env = context.env;

    if (!pluginConfig.chartPath) {
        errors.push('Missing argument: chartPath');
    }

    if (pluginConfig.registry && env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD) {
        const registryUrl = pluginConfig.registry.split('/')[0];
        try {
            await verifyRegistryLogin(registryUrl, env.REGISTRY_USERNAME, env.REGISTRY_PASSWORD);
        } catch (error) {
            errors.push('Could not login to registry. Wrong credentials?', error);
        }
    }

    if (pluginConfig.registry && pluginConfig.registry.startsWith('s3://')) {
        try {
            await installHelmS3Plugin();
        } catch (error) {
            // TODO Maybe add better error handling?
            // Do not fail if plugin is already installed
        }
        try {
            await verifyS3Credentials(pluginConfig.registry);
        } catch (error) {
            errors.push('Could not login to S3. Wrong credentials?', error);
        }
    }

    if (pluginConfig.crPublish) {
        try {
            await parseGithubRepo(context.options.repositoryUrl)
        } catch (error) {
            errors.push('Not a github.com url', error);
        }
        try {
            await verifyCrConfig(pluginConfig)
        } catch (error) {
            errors.push('Chart-releaser configuration issue', error);
        }
        try {
            await verifyCrExecutable()
        } catch (error) {
            errors.push('Chart-releaser (cr) could not be found.', error);
        }

    }

    if (errors.length > 0) {
        throw new AggregateError(errors);
    }
};

async function verifyRegistryLogin(registryUrl, registryUsername, registryPassword) {
    await execa(
        'helm',
        ['registry', 'login', '--username', registryUsername, '--password-stdin', registryUrl],
        {
            input: registryPassword,
            env: {
                HELM_EXPERIMENTAL_OCI: 1
            }
        }
    );
}

async function installHelmS3Plugin() {
    await execa(
        'helm',
        ['plugin', 'install', 'https://github.com/hypnoglow/helm-s3.git']
    );
}

async function verifyS3Credentials(registryUrl) {
    await execa(
        'helm',
        ['repo', 'add', 'semantic-release-helm', registryUrl]
    );
}

async function parseGithubRepo(repositoryUrl) {
    const repoParts = /https:\/\/github.com(\/|:)([^/]+)\/([^\.]+)/.exec(repositoryUrl)
    if (!repoParts) {
        throw new Error('Did not match github. Only github over https is supported by chart-releaser');
    }

    return {
        owner: repoParts[2],
        project: repoParts[3],
    }
}

async function verifyCrConfig(pluginConfig) {
    if (!pluginConfig.crConfigPath) {
        throw new Error('crConfigPath is required. Wrong path?')
    }
}

async function verifyCrExecutable() {
    try {
        await execa('cr', ['version'])
    } catch (error) {
        const version = '1.2.1'
        const cacheDir = '/tmp/cr/'
        try {
            await execa('mkdir', ['-p', cacheDir])
            await execa('curl', ['-sSLo', 'cr.tar.gz', `https://github.com/helm/chart-releaser/releases/download/v${version}/chart-releaser_${version}_linux_amd64.tar.gz`])
            await execa('tar', ['-xzf', 'cr.tar.gz', '-C', cacheDir])
            await execa('rm', ['-f', 'cr.tar.gz'])
            await execa(`${cacheDir}/cr`, ['version'])

            return 
        } catch (error) {
            throw new Error('Failed to install cr: ' + error)
        }
    }
}
