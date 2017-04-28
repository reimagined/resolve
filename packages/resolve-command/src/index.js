function verifyCommand(command) {
    if (!command.aggregateId) return Promise.reject('aggregateId argument is required');
    if (!command.commandName) return Promise.reject('commandName argument is required');

    return Promise.resolve(command);
}

function getAggregateState(aggregate, aggregateId, store) {
    const initialStateFunc = aggregate.initialState || (() => ({}));
    const handlers = aggregate.handlers;
    let aggregateState = initialStateFunc();

    if (!handlers) {
        return Promise.resolve(aggregateState);
    }

    return store.loadEventsByAggregateId(aggregateId, (event) => {
        aggregateState = handlers[event.__type](aggregateState, event);
    }).then(() => aggregateState);
}

function executeCommand(command, aggregate, store) {
    return getAggregateState(aggregate, command.aggregateId, store)
        .then((aggregateState) => {
            const handler = aggregate.commands[command.commandName];
            const event = handler(aggregateState, command);
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

export default function ({ store, bus, aggregate }) {
    return rawCommand => verifyCommand(rawCommand)
        .then(command => executeCommand(command, aggregate, store))
        .then(event => saveEvent(event, store))
        .then(event => publishEvent(event, bus));
}
