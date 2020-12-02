module.exports = async (pluginConfig) => {
    const {chartPath} = pluginConfig;
    if (!chartPath) {
        throw new Error('Missing argument: chartPath');
    }
};
