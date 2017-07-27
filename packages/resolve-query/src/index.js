import 'regenerator-runtime/runtime';

function getExecutor({ eventStore, readModel }) {
    const eventTypes = Object.keys(readModel.eventHandlers);
    let state = readModel.initialState || {};
    let error = null;
    let result = null;

    return async () => {
        result =
            result ||
            eventStore.subscribeByEventType(eventTypes, (event) => {
                const handler = readModel.eventHandlers[event.type];
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

export default ({ eventStore, readModels }) => {
    const executors = readModels.reduce((result, readModel) => {
        result[readModel.name.toLowerCase()] = getExecutor({
            eventStore,
            readModel
        });
        return result;
    }, {});

    return async (readModelName) => {
        const executor = executors[readModelName.toLowerCase()];

        if (executor === undefined) {
            throw new Error(`The '${readModelName}' read model is not found`);
        }

        return executor();
    };
};
