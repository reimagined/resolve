import 'regenerator-runtime/runtime';

const verifyCommand = async (command) => {
    if (!command.aggregateId) throw new Error('"aggregateId" argument is required');
    if (!command.aggregateName) throw new Error('"aggregateName" argument is required');
    if (!command.type) throw new Error('"type" argument is required');
};

const getAggregateState = async (aggregate, aggregateId, eventStore) => {
    const handlers = aggregate.eventHandlers;
    let aggregateState = aggregate.initialState;

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
    const aggregateState = await getAggregateState(aggregate, command.aggregateId, eventStore);

    const handler = aggregate.commands[command.type];
    const event = handler(aggregateState, command, securityContext);

    if (!event.type) {
        throw new Error('event type is required');
    }

    event.aggregateId = command.aggregateId;
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
