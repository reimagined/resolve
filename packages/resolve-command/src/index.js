import 'regenerator-runtime/runtime';

const verifyCommand = async ({ aggregateId, aggregateName, type }) => {
    if (!aggregateId) throw new Error('"aggregateId" argument is required');
    if (!aggregateName) throw new Error('"aggregateName" argument is required');
    if (!type) throw new Error('"type" argument is required');
};

const getAggregateState = async ({ eventHandlers, initialState }, aggregateId, eventStore) => {
    const handlers = eventHandlers;
    let aggregateState = initialState;

    if (!handlers) {
        return Promise.resolve(aggregateState);
    }

    await eventStore.getEventsByAggregateId(aggregateId, (event) => {
        const handler = handlers[event.type];
        if (!handler) return;

        aggregateState = handler(aggregateState, event);
    });

    return aggregateState;
};

const executeCommand = async (command, aggregate, eventStore, securityContext) => {
    const { aggregateId, type } = command;
    const aggregateState = await getAggregateState(aggregate, aggregateId, eventStore);

    const handler = aggregate.commands[type];
    const event = handler(aggregateState, command, securityContext);

    if (!event.type) {
        throw new Error('event type is required');
    }

    event.aggregateId = aggregateId;
    event.timestamp = Date.now();
    return event;
};

function createExecutor({ eventStore, aggregate, securityContext }) {
    return async (command, securityContext) => {
        const event = await executeCommand(command, aggregate, eventStore, securityContext);
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

    return async (command, securityContext) => {
        await verifyCommand(command);
        const aggregateName = command.aggregateName.toLowerCase();
        return executors[aggregateName](command, securityContext);
    };
};
