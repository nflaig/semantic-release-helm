const AggregateError = require('aggregate-error');
const execa = require('execa');
const {verifyHelmVersion, installHelmPlugin} = require('./utils');

module.exports = async (pluginConfig, context) => {
    const errors = [];

    const env = context.env;

    if (!pluginConfig.chartPath) {
        errors.push('Missing argument: chartPath');
    }

    const registryHost = env.REGISTRY_HOST || pluginConfig.registry;

    if (registryHost && !pluginConfig.isChartMuseum && env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD) {
        const registryUrl = registryHost.replace("oci://", "").split('/')[0];
        try {
            await verifyRegistryLogin(registryUrl, env.REGISTRY_USERNAME, env.REGISTRY_PASSWORD, pluginConfig.skipRegistryLogin);
        } catch (error) {
            errors.push('Could not login to registry. Wrong credentials?', error);
        }
    }

    if (registryHost && pluginConfig.isChartMuseum) {
        if (/^https?/i.test(registryHost)) {
            try {
                if (env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD) {
                    try {
                        // --password-stdin flag of helm repo add command requires helm version >=3.7.0
                        await verifyHelmVersion('3.7.0');
                    } catch (error) {
                        errors.push(error);
                    }
                }

                await addChartRepository(registryHost, env.REGISTRY_USERNAME, env.REGISTRY_PASSWORD);
            } catch (error) {
                errors.push('Could not add chart repository. Wrong credentials?', error);
            }
        } else {
            errors.push('Invalid registry. For ChartMuseum it is required to specify the repository URL.');
        }

        try {
            await installCMPushPlugin();
        } catch (error) {
            errors.push('Could not install helm cm-push plugin.', error);
        }
    }

    if (registryHost && registryHost.startsWith('s3://')) {
        try {
            await installHelmS3Plugin();
        } catch (error) {
            errors.push('Could not install helm s3 plugin.', error);
        }  

        try {
            await verifyS3Credentials(registryHost);
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

async function verifyRegistryLogin(registryUrl, registryUsername, registryPassword, skipRegistryLogin) {
    if (skipRegistryLogin) return;

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

async function addChartRepository(repositoryUrl, username, password) {
    if (username && password) {
        await execa(
            'helm',
            ['repo', 'add', '--username', username, '--password-stdin', 'semantic-release-helm', repositoryUrl],
            {
                input: password,
            }
        );
    } else {
        await execa(
            'helm',
            ['repo', 'add', 'semantic-release-helm', repositoryUrl]
        );
    }
}

async function installCMPushPlugin() {
    await installHelmPlugin('https://github.com/chartmuseum/helm-push', '0.10.3');
}

async function installHelmS3Plugin() {
    await installHelmPlugin('https://github.com/hypnoglow/helm-s3.git', '0.14.0');
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
