const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('yaml');
const { getChartPath } = require('./utils');

module.exports = async (pluginConfig, {nextRelease: {version, notes}, logger, env, cwd}) => {
    const filePath = path.join(getChartPath(pluginConfig, {env, cwd}), 'Chart.yaml');

    const chartYaml = await fsPromises.readFile(filePath);
    const doc = yaml.parseDocument(chartYaml.toString());

    if (pluginConfig.onlyUpdateVersion) {
        doc.set('version', version);
        logger.log('Updating Chart.yaml with version %s.', version);
    } else {
        doc.set('version', version);
        doc.set('appVersion', version);
        logger.log('Updating Chart.yaml with version %s and appVersion %s.', version, version);
    }

    if (pluginConfig.populateChangelog) {
        doc.setIn(['annotations', 'artifacthub.io/changes'], notes);
        logger.log('updating annotations artifacthub.io/changes with %s', notes);
    }

    await fsPromises.writeFile(filePath, String(doc));
};
