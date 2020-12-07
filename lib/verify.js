const AggregateError = require('aggregate-error');
const execa = require('execa');

module.exports = async (pluginConfig, context) => {
    const errors = [];

    const env = context.env;

    if (!pluginConfig.path) {
        errors.push('Missing argument: path');
    }

    if (pluginConfig.registry && env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD) {
        const registryUrl = pluginConfig.registry.split('/')[0];
        try {
            await verifyRegistryLogin(registryUrl, env.REGISTRY_USERNAME, env.REGISTRY_PASSWORD);
        } catch (error) {
            errors.push('Could not login to registry. Wrong credentials?', error);
        }
    }

    if (errors.length > 0) {
        throw new AggregateError(errors);
    }
};

async function verifyRegistryLogin(registryUrl, registryUsername, registryPassword) {
    await execa(
        'helm',
        ['registry', 'login', '--username', registryUsername, '--password-stdin', registryUrl],
        {
            input: registryPassword,
            env: {
                HELM_EXPERIMENTAL_OCI: 1
            }
        }
    );
}
