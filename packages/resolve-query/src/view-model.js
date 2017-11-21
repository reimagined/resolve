import 'regenerator-runtime/runtime';

const subscribeByEventTypeAndIds = async (eventStore, callback, eventDescriptors) => {
    return await eventStore.subscribeByAggregateId(eventDescriptors.ids, (event) => {
        if (!eventDescriptors.types.includes(event.type)) {
            return;
        }
        callback(event);
    });
};

const GeneratorProto = (function*() {})().__proto__.__proto__;
const PromiseProto = (async function () {})().__proto__;
const filterAsyncResult = (result) => {
    if (!result || !result.__proto__) return;
    if (result.__proto__.__proto__ === GeneratorProto) {
        throw new Error('A Projection function cannot be a generator or return an iterable object');
    }
    if (result.__proto__ === PromiseProto) {
        throw new Error('A Projection function cannot be asynchronous or return a Promise object');
    }
};

const createViewModel = ({ projection, eventStore }) => {
    const getKey = aggregateIds =>
        Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds;
    const viewMap = new Map();

    const reader = async (aggregateIds) => {
        if (aggregateIds !== '*' && (!Array.isArray(aggregateIds) || aggregateIds.length === 0)) {
            throw new Error(
                'View models are build up only with aggregateIds array or wildcard argument'
            );
        }

        const key = getKey(aggregateIds);

        if (viewMap.has(key)) {
            const executor = viewMap.get(key);
            return await executor();
        }

        const executor = async () => {
            let state = typeof projection.Init === 'function' && projection.Init();
            filterAsyncResult(state);
            let error = null;

            const callback = (event) => {
                if ((event && event.type === 'Init') || error) return;
                try {
                    state = projection[event.type](state, event);
                    filterAsyncResult(state);
                } catch (err) {
                    error = err;
                }
            };

            const eventTypes = Object.keys(projection);

            const unsubscribe =
                aggregateIds === '*'
                    ? await eventStore.subscribeByEventType(eventTypes, callback)
                    : await eventStore.subscribeByAggregateId(
                          aggregateIds,
                          event => eventTypes.includes(event.type) && callback(event)
                      );

            if (!executor.disposing) {
                executor.dispose = unsubscribe;
            } else {
                unsubscribe();
            }

            if (error) throw error;
            return state;
        };

        executor.dispose = () => (executor.disposing = true);

        viewMap.set(key, executor);
        return await executor();
    };

    reader.dispose = () => {
        viewMap.forEach(executor => executor.dispose());
        viewMap.clear();
    };

    return reader;
};

export default createViewModel;
