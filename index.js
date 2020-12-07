const verifyChart = require('./lib/verify');
const prepareChart = require('./lib/prepare');
const publishChart = require('./lib/publish');

let verified = false;
let prepared = false;

async function verify(pluginConfig, context) {
    await verifyChart(pluginConfig, context);
    verified = true;
}

async function prepare(pluginConfig, context) {
    if (!verified) {
        await verifyChart(pluginConfig, context);
    }

    await prepareChart(pluginConfig, context);
    prepared = true;
}

async function publish(pluginConfig, context) {
    if (!verified) {
        await verifyChart(pluginConfig, context);
    }
    if (!prepared) {
        await prepareChart(pluginConfig, context);
    }

    await publishChart(pluginConfig, context);
}

module.exports = {verify, prepare, publish};
