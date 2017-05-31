import 'regenerator-runtime/runtime';

function getExecutor({ eventStore, projection }) {
    const eventTypes = Object.keys(projection.eventHandlers);
    let state = projection.initialState || {};
    let error = null;

    const eventStream = eventStore.getStreamByEventTypes(eventTypes);

    eventStream.on('readable', () => {
        let event;
        // eslint-disable-next-line no-cond-assign
        while (null !== (event = eventStream.read())) {
            const handler = projection.eventHandlers[event.type];
            if (!handler) continue;

            try {
                state = handler(state, event);
            } catch (err) {
                error = err;
            }
        }
    });

    eventStream.on('error', err => (error = err));

    return async () => {
        if (!error) return state;
        throw error;
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
