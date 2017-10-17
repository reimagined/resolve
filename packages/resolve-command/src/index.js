import 'regenerator-runtime/runtime';

const verifyCommand = async ({ aggregateId, aggregateName, type }) => {
    if (!aggregateId) throw new Error('"aggregateId" argument is required');
    if (!aggregateName) throw new Error('"aggregateName" argument is required');
    if (!type) throw new Error('"type" argument is required');
};

const getAggregateState = async ({ projection, initialState }, aggregateId, eventStore) => {
    const handlers = projection;
    let aggregateState = initialState;
    aggregateState.version = 0;

    if (!handlers) {
        return Promise.resolve(aggregateState);
    }

    await eventStore.getEventsByAggregateId(aggregateId, (event) => {
        aggregateState.version = event.aggregateVersion;
        const handler = handlers[event.type];
        if (!handler) return;

        aggregateState = handler(aggregateState, event);
    });

    return aggregateState;
};

const executeCommand = async (command, aggregate, eventStore, getJwt) => {
    const { aggregateId, type } = command;
    const aggregateState = await getAggregateState(aggregate, aggregateId, eventStore);

    const handler = aggregate.commands[type];
    const event = handler(aggregateState, command, getJwt);

    if (!event.type) {
        throw new Error('event type is required');
    }

    event.aggregateId = aggregateId;
    event.aggregateVersion = ++aggregateState.version;
    return event;
};

function createExecutor({ eventStore, aggregate, getJwt }) {
    return async (command, getJwt) => {
        const event = await executeCommand(command, aggregate, eventStore, getJwt);
        return await eventStore.saveEvent(event);
    };
}

export default ({ eventStore, aggregates }) => {
    const executors = aggregates.reduce((result, aggregate) => {
        result[aggregate.name.toLowerCase()] = createExecutor({
            eventStore,
            aggregate
        });
        return result;
    }, {});

    return async (command, getJwt) => {
        await verifyCommand(command);
        const aggregateName = command.aggregateName.toLowerCase();
        return executors[aggregateName](command, getJwt);
    };
};
