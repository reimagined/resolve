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

const makeTemporaryExecutor = (readModel, eventStore) => {
    const projection = readModel.projection;

    return async (aggregateIds) => {
        let state = typeof projection.Init === 'function' && projection.Init();
        filterAsyncResult(state);
        let error = null;

        if (!Array.isArray(aggregateIds) || aggregateIds.length === 0) {
            return state;
        }

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

        unsubscribe();
        if (error) throw error;
        return state;
    };
};

export default makeTemporaryExecutor;
