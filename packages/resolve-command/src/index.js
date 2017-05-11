function verifyCommand(command) {
    if (!command.aggregateId) return Promise.reject('aggregateId argument is required');
    if (!command.commandName) return Promise.reject('commandName argument is required');

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
        const handler = aggregate.commands[command.commandName];
        const event = handler(aggregateState, command);

        event.type = typeof event.type === 'function'
            ? event.type()
            : command.aggregate + event.type;

        return Object.assign(
            {
                aggregateId: command.aggregateId
            },
            event
        );
    });
}

function saveEvent(event, store) {
    return store.saveEvent(event).then(() => event);
}

function publishEvent(event, bus) {
    bus.emitEvent(event);
    return event;
}

const executor = ({ store, bus, aggregate }) => rawCommand =>
    verifyCommand(rawCommand)
        .then(command => executeCommand(command, aggregate, store))
        .then(event => saveEvent(event, store))
        .then(event => publishEvent(event, bus));

export default ({ store, bus, aggregates }) => {
    const names = Object.keys(aggregates);
    const executors = names.reduce((result, name) => {
        result[name] = executor({ store, bus, aggregate: aggregates[name] });
        return result;
    }, {});

    return command => executors[command.aggregate](command);
};
