const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

module.exports = async (pluginConfig, { nextRelease: { version, notes }, logger, env }) => {
    const filePath = path.join(env.CHART_PATH || pluginConfig.chartPath, 'Chart.yaml');

    const chartYaml = await fsPromises.readFile(filePath);
    const oldChart = yaml.load(chartYaml);

    // increase line width to prevent formatting of Chart.yaml
    const yamlDumpOptions = {lineWidth: 999};

    let newChart;
    if (pluginConfig.onlyUpdateVersion) {
        newChart = {...oldChart, version: version};
        logger.log('Updating Chart.yaml with version %s.', version);
    } else {
        newChart = {...oldChart, version: version, appVersion: version};
        logger.log('Updating Chart.yaml with version %s and appVersion %s.', version, version);
    }

    if (pluginConfig.populateChangelog) {
        newChart.annotations = newChart.annotations || {}
        newChart.annotations['artifacthub.io/changes'] = notes
        logger.log('updating annotations artifacthub.io/changes with %s', notes);
    }

    await fsPromises.writeFile(filePath, yaml.dump(newChart, yamlDumpOptions));
};
