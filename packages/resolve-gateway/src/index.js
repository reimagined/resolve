import 'regenerator-runtime/runtime';

function getExecutor({ eventStore, gateway }) {
    const eventTypes = Object.keys(gateway.eventHandlers || {});
    let gatewayPromise = Promise.resolve();
    let state = gateway.initialState || {};
    let error = null;
    let result = null;

    return async () => {
        result =
            result ||
            eventStore.subscribeByEventType(eventTypes, (event) => {
                const handler = gateway.eventHandlers[event.type];
                if (!handler) return;

                try {
                    state = handler(state, event);
                } catch (err) {
                    error = err;
                }
            });

        await result;
        if (error) throw error;

        await gatewayPromise;

        gatewayPromise = gatewayPromise.then(() =>
            gateway.execute(state, eventStore.saveEvent.bind(eventStore))
        );
    };
}

export default ({ eventStore, gateways }) => {
    const executors = gateways.reduce((result, gateway) => {
        result[gateway.name.toLowerCase()] = getExecutor({
            eventStore,
            gateway
        });
        return result;
    }, {});

    return async (gatewayName) => {
        const executor = executors[gatewayName.toLowerCase()];

        if (executor === undefined) {
            throw new Error(`The '${gatewayName}' projection is not found`);
        }

        return executor();
    };
};
