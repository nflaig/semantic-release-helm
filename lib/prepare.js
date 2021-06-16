const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const semver = require('semver');

module.exports = async (pluginConfig, context) => {
    const logger = context.logger;

    let version;
    const appVersion = context.nextRelease.version;

    const filePath = path.join(pluginConfig.chartPath, 'Chart.yaml');

    const chartYaml = await fsPromises.readFile(filePath);
    const oldChart = yaml.load(chartYaml);

    version = semver.inc(oldChart.version, context.nextRelease.type);

    let newChart;
    if (pluginConfig.onlyUpdateVersion) {
        newChart = yaml.dump({...oldChart, version: version});
        logger.log('Updating Chart.yaml with version %s.', version);
    } else {
        newChart = yaml.dump({...oldChart, version: version, appVersion: appVersion});
        logger.log('Updating Chart.yaml with version %s and appVersion %s.', version, appVersion);
    }

    await fsPromises.writeFile(filePath, newChart);
};
