const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

module.exports = async (pluginConfig, {nextRelease: {version}, logger}) => {
    const filePath = path.join(pluginConfig.chartPath, 'Chart.yaml');

    const chartYaml = await fsPromises.readFile(filePath);
    const oldChart = yaml.load(chartYaml);

    // increase line width to prevent formatting of Chart.yaml
    const yamlDumpOptions = {lineWidth: 999};

    let newChart;
    if (pluginConfig.onlyUpdateVersion) {
        newChart = yaml.dump({...oldChart, version: version}, yamlDumpOptions);
        logger.log('Updating Chart.yaml with version %s.', version);
    } else {
        newChart = yaml.dump({...oldChart, version: version, appVersion: version}, yamlDumpOptions);
        logger.log('Updating Chart.yaml with version %s and appVersion %s.', version, version);
    }

    await fsPromises.writeFile(filePath, newChart);
};
