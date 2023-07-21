const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const execa = require('execa');
const semver = require('semver');
const {getInstalledHelmVersion, parseExtraArgs} = require('./utils');

module.exports = async (pluginConfig, context) => {
    const logger = context.logger;
    const env = context.env;
    const registryHost = env.REGISTRY_HOST || pluginConfig.registry;

    if (registryHost) {
        // default to path from env
        // set the pluginConfig accordingly, because functions use named parameters
        pluginConfig.chartPath = env.CHART_PATH || pluginConfig.chartPath;;

        if (pluginConfig.isChartMuseum) {
            await publishChartToChartMuseum(pluginConfig);
        } else {
            const filePath = path.join(pluginConfig.chartPath, 'Chart.yaml');
    
            const chartYaml = await fsPromises.readFile(filePath);
            const chart = yaml.load(chartYaml);
            await publishChartToRegistry(pluginConfig, chart, context);
        }

        logger.log('Chart successfully published.');
    } else if (pluginConfig.crPublish) {
        await publishChartUsingCr(pluginConfig, context)
    } else {
        logger.log('Chart not published.');
    }
};

async function publishChartToChartMuseum({chartPath, cmPushArgs}) {
    await execa(
        'helm',
        ['cm-push', chartPath, ...parseExtraArgs(cmPushArgs), 'semantic-release-helm']
    );
    await execa(
        'helm',
        ['repo', 'remove', 'semantic-release-helm']
    );
}

async function publishChartToRegistry({ chartPath, registry, packageArgs }, { name, version }, context) {
    const env = context.env;
    let registryHost = env.REGISTRY_HOST || registry;

    if (registryHost) {
        if (registryHost.startsWith('s3://')) {
            const chartName = `${name}-${version}.tgz`;
            await execa(
                'helm',
                ['dependency', 'build', chartPath]
            );
            await execa(
                'helm',
                ['package', chartPath, ...parseExtraArgs(packageArgs)]
            );
            await execa(
                'helm',
                ['s3', 'push', chartName, 'semantic-release-helm', '--relative']
            );
            await execa(
                'rm',
                ['-f', chartName]
            );
            await execa(
                'helm',
                ['repo', 'remove', 'semantic-release-helm']
            );
        } else {
            const helmVersion = await getInstalledHelmVersion();

            if (semver.gte(helmVersion, '3.7.0')) {
                const { stdout } = await execa(
                    'helm',
                    ['package', chartPath, ...parseExtraArgs(packageArgs)],
                    {
                        env: {
                            HELM_EXPERIMENTAL_OCI: 1
                        }
                    }
                );

                const chartArchive = stdout.split(":")[1].trim();
                registryHost = registryHost.startsWith("oci://") ? registryHost : `oci://${registryHost}`;

                await execa(
                    'helm',
                    ['push', chartArchive, registryHost],
                    {
                        env: {
                            HELM_EXPERIMENTAL_OCI: 1
                        }
                    }
                );
            } else {
                await execa(
                    'helm',
                    ['chart', 'save', chartPath, registryHost + ':' + version],
                    {
                        env: {
                            HELM_EXPERIMENTAL_OCI: 1
                        }
                    }
                );
                await execa(
                    'helm',
                    ['chart', 'push', registryHost + ':' + version],
                    {
                        env: {
                            HELM_EXPERIMENTAL_OCI: 1
                        }
                    }
                );
            }
        }
    }
}

async function publishChartUsingCr({chartPath, crConfigPath, packageArgs}, context) {
    const logger = context.logger;
    const env = context.env;

    const crExec = await findCrExec()
    const { owner, project } = await parseGithubRepo(context.options.repositoryUrl)

    const globalArgs = ['--config', crConfigPath]
    const ghArgs = [
        '--git-repo', `https://${owner}.github.io/${project}`,
        '--token', env.GITHUB_TOKEN,
        '-o', owner, 
        '-r', project, 
    ]

    await execa(
        'sh', ['-c', 'rm -rf .cr-index .cr-release-packages && mkdir -p .cr-index .cr-release-packages']
    )
    const pkgOut = await execa(
        crExec, [
            ...globalArgs,
            'package', chartPath,
            ...parseExtraArgs(packageArgs)
        ]
    )
    logger.info(pkgOut.stdout)
    const uploadOut = await execa(
        crExec, [
            ...globalArgs,
            ...ghArgs,
            'upload', 
            '--skip-existing'
        ]
    )
    logger.info(uploadOut.stdout)
    const indexOut = await execa(
        crExec, [
            ...globalArgs,
            ...ghArgs,
            'index', 
            '--charts-repo', `https://${owner}.github.io/${project}`,
            '--push'
        ]
    )
    logger.info(indexOut.stdout)
}

async function findCrExec() {
    try {
        await execa('cr', ['version'])
        return 'cr'
    } catch (error) {
        return '/tmp/cr/cr'
    }
}
