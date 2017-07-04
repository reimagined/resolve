import 'regenerator-runtime/runtime';

function getExecutor({ eventStore, projection }) {
    const eventTypes = Object.keys(projection.eventHandlers);
    let state = projection.initialState || {};
    let error = null;
    let result = null;

    return async () => {
        result =
            result ||
            eventStore.subscribeByEventType(eventTypes, (event) => {
                const handler = projection.eventHandlers[event.type];
                if (!handler) return;

                try {
                    state = handler(state, event);
                } catch (err) {
                    error = err;
                }
            });

        await result;
        if (error) throw error;

        return state;
    };
}

export default ({ eventStore, projections }) => {
    const executors = projections.reduce((result, projection) => {
        result[projection.name.toLowerCase()] = getExecutor({
            eventStore,
            projection
        });
        return result;
    }, {});

    return async (projectionName) => {
        const executor = executors[projectionName.toLowerCase()];

        if (executor === undefined) {
            throw new Error(`The '${projectionName}' projection is not found`);
        }

        return executor();
    };
};
