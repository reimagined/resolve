import 'regenerator-runtime/runtime';

const subscribeByEventTypeAndIds = async (eventStore, callback, eventDescriptors) => {
    const passedEvents = new WeakSet();
    const trigger = event => !passedEvents.has(event) && passedEvents.add(event) && callback(event);

    const conditionalSubscribe = (section, subscriber) =>
        Array.isArray(section) ? subscriber(section, trigger) : Promise.resolve(() => {});

    const unsubscribers = await Promise.all([
        conditionalSubscribe(eventDescriptors.types, eventStore.subscribeByEventType),
        conditionalSubscribe(eventDescriptors.ids, eventStore.subscribeByAggregateId)
    ]);

    return () => unsubscribers.forEach(func => func());
};

const GeneratorProto = (function*() {})().__proto__.__proto__;
const PromiseProto = (async function () {})().__proto__;
const filterAsyncResult = (result) => {
    if (!result || !result.__proto__) return;
    if (result.__proto__.__proto__ === GeneratorProto) {
        throw new Error('Projection function cannot be generator or return iterable object');
    }
    if (result.__proto__ === PromiseProto) {
        throw new Error('Projection function cannot be asyncronous or return Promise object');
    }
};

const createViewModel = ({ projection, eventStore }) => {
    const getKey = aggregateIds => aggregateIds.sort().join(',');
    const viewMap = new Map();

    const reader = async (aggregateIds) => {
        if (!Array.isArray(aggregateIds) || aggregateIds.length === 0) {
            throw new Error('View models are build up only with aggregateIds array argument');
        }

        const key = getKey(aggregateIds);
        if (viewMap.has(key)) {
            return viewMap.get(key);
        }

        let dispose = null;
        const disposePromise = new Promise(resolve => (dispose = resolve));

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

            const unsubscribe = await subscribeByEventTypeAndIds(eventStore, callback, {
                types: Object.keys(projection),
                ids: aggregateIds
            });

            disposePromise.then(unsubscribe);

            if (error) throw error;
            return state;
        };

        executor.dispose = dispose;

        viewMap.set(key, executor);
        return executor;
    };

    reader.dispose = () => {
        viewMap.forEach(executor => executor.dispose());
        viewMap.clear();
    };

    return reader;
};

export default createViewModel;
