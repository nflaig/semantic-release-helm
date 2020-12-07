const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const execa = require('execa');

module.exports = async (pluginConfig, context) => {
    const logger = context.logger;

    const filePath = path.join(pluginConfig.path, 'Chart.yaml');

    const chartYaml = await fsPromises.readFile(filePath);
    const chart = yaml.safeLoad(chartYaml);

    await publishChart(pluginConfig.path, pluginConfig.registry, chart.version);

    logger.log('Chart successfully published.');
};

async function publishChart(path, registry, version) {
    await execa(
        'helm',
        ['chart', 'save', path, registry + ':' + version],
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
