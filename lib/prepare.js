const fsPromises = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const semver = require('semver');

module.exports = async (pluginConfig, context) => {
    const chartPath = pluginConfig.chartPath;
    const logger = context.logger;

    let version;
    const appVersion = context.nextRelease.version;

    let filehandle;
    try {
        filehandle = await fsPromises.open(path.join(chartPath, 'Chart.yaml'), 'r+');
        const chartYaml = await fsPromises.readFile(filehandle, 'utf8');
        const oldChart = yaml.safeLoad(chartYaml);

        version = semver.inc(oldChart.version, context.nextRelease.type);

        const newChart = yaml.safeDump({...oldChart, version: version, appVersion: appVersion});
        await fsPromises.writeFile(filehandle, newChart);
        console.log(newChart);
    } finally {
        if (filehandle !== undefined)
            await filehandle.close();
    }

    logger.log('Chart.yaml updated with version %s and appVersion %s.', version, appVersion);
};
