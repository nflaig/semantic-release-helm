const verifyChart = require('./lib/verify');
const prepareChart = require('./lib/prepare');

let verified;
let prepared;

async function verify(pluginConfig, context) {
    await verifyChart(pluginConfig);
    verified = true;
}

async function prepare(pluginConfig, context) {
    if (!verified) {
        await verifyChart(pluginConfig);
    }

    await prepareChart(pluginConfig, context);
    prepared = true;
}

module.exports = {verify, prepare};
