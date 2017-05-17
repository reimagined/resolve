function verifyCommand(command) {
    if (!command.aggregateId) return Promise.reject('"aggregateId" argument is required');
    if (!command.aggregateName) return Promise.reject('"aggregateName" argument is required');
    if (!command.type) return Promise.reject('"type" argument is required');

    return Promise.resolve(command);
}

function getAggregateState(aggregate, aggregateId, store) {
    const initialStateFunc = aggregate.initialState || (() => ({}));
    const handlers = aggregate.eventHandlers;
    let aggregateState = initialStateFunc();

    if (!handlers) {
        return Promise.resolve(aggregateState);
    }

    return store
        .loadEventsByAggregateId(aggregateId, (event) => {
            const handler = handlers[event.type];
            if (handler) {
                aggregateState = handler(aggregateState, event);
            }
        })
        .then(() => aggregateState);
}

function executeCommand(command, aggregate, store) {
    return getAggregateState(aggregate, command.aggregateId, store).then((aggregateState) => {
        const handler = aggregate.commands[command.type];
        const event = handler(aggregateState, command);

        if (!event.type) {
            return Promise.reject("event type is required");
        }

        event.aggregateId = command.aggregateId;
        event.type = event.type;
        event.timestamp = Date.now();
        return event;
    });
}

function saveEvent(event, store) {
    return store.saveEvent(event).then(() => event);
}

function publishEvent(event, bus) {
    bus.emitEvent(event);
    return event;
}

const createExecutor = ({ store, bus, aggregate }) => command =>
    executeCommand(command, aggregate, store)
        .then(event => saveEvent(event, store))
        .then(event => publishEvent(event, bus));

export default ({ store, bus, aggregates }) => {
    const executors = aggregates.reduce((result, aggregate) => {
        result[aggregate.name.toLowerCase()] = createExecutor({
            store,
            bus,
            aggregate
        });
        return result;
    }, {});

    return command =>
        verifyCommand(command).then(() => executors[command.aggregateName.toLowerCase()](command));
};
