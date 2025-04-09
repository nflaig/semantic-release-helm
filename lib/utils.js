const execa = require('execa');
const semver = require('semver');

async function getInstalledHelmVersion() {
    const { stdout } = await execa(
        'helm',
        ['version', '--template={{.Version}}']
    );

    return stdout.replace('v', '');
}

async function verifyHelmVersion(requiredVersion) {
    const installedVersion  = await getInstalledHelmVersion();
    
    if (!semver.gte(installedVersion, requiredVersion)) {
        throw new Error(`Helm version ${installedVersion} is insufficient. At least version ${requiredVersion} has to be installed.`);
    }
}

async function installHelmPlugin(pluginUrl, version) {
    const versionArgs = version ? ['--version', version] : [];

    try {
        await execa(
            'helm',
            ['plugin', 'install', pluginUrl, ...versionArgs]
        );
    } catch (error) {
        // ignore error if plugin is already installed
        if (!error.stderr.includes('plugin already exists')) {
            throw error;
        }
    }
}

function parseExtraArgs(args) {
    if (!args) {
      return [];
    }
    // match quoted strings and non-quoted substrings
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const result = [];
    let match;
    while (match = regex.exec(args)) {
      result.push(match[1] || match[2] || match[0]);
    }
    return result;
}

function getChartPath(pluginConfig, {env, cwd}) {
    return env.CHART_PATH || pluginConfig.chartPath || cwd;
}

module.exports = {
    getInstalledHelmVersion,
    verifyHelmVersion,
    installHelmPlugin,
    parseExtraArgs,
    getChartPath,
};
