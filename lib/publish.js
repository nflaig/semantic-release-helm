const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const execa = require('execa');

module.exports = async (pluginConfig, context) => {
    const logger = context.logger;

    if (pluginConfig.registry) {
        const filePath = path.join(pluginConfig.chartPath, 'Chart.yaml');

        const chartYaml = await fsPromises.readFile(filePath);
        const chart = yaml.load(chartYaml);
        await publishChartToRegistry(pluginConfig.chartPath, pluginConfig.registry, chart.name, chart.version);
        logger.log('Chart successfully published.');
    } else if (pluginConfig.crPublish) {
        await publishChartUsingCr(pluginConfig.chartPath, pluginConfig.crConfigPath, context)
    } else {
        logger.log('Chart not published.');
    }
};

async function publishChartToRegistry(configPath, registry, name, version) {
    if (registry) {
        if (registry.startsWith('s3://')) {
            const chartName = `${name}-${version}.tgz`;
            await execa(
                'helm',
                ['dependency', 'build', configPath]
            );
            await execa(
                'helm',
                ['package', configPath]
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
            await execa(
                'helm',
                ['chart', 'save', configPath, registry + ':' + version],
                {
                    env: {
                        HELM_EXPERIMENTAL_OCI: 1
                    }
                }
            );
            await execa(
                'helm',
                ['chart', 'push', registry + ':' + version],
                {
                    env: {
                        HELM_EXPERIMENTAL_OCI: 1
                    }
                }
            );
        }
    }
}


async function publishChartUsingCr(chartPath, crConfigPath, context) {
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
            'package', chartPath
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
