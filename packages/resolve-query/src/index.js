function updateState(projection, event, state) {
    return projection.eventHandlers[event.type](state, event);
}

const executor = ({ store, bus, projection }) => {
    const eventTypes = Object.keys(projection.eventHandlers);
    let state = projection.initialState || {};

    const handler = event => (state = updateState(projection, event, state));

    let result = null;
    return () => {
        result =
            result ||
            store.loadEventsByTypes(eventTypes, handler).then(() => {
                bus.onEvent(eventTypes, handler);
            });

        return result.then(() => state);
    };
};

function createExecutor({ store, bus, projections }) {
    const executors = projections.reduce((result, projection) => {
        result[projection.name.toLowerCase()] = executor({
            store,
            bus,
            projection
        });
        return result;
    }, {});

    return (name) => {
        const executor = executors[name.toLowerCase()];

        if (executor === undefined) {
            return Promise.reject(new Error(`The '${name}' projection is not found`));
        }

        return executor();
    };
}

module.exports = createExecutor;
export default createExecutor;
