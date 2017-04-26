const INITIAL_STATE_FUNC = '__initialState';
const BUILD_STATE_FUNC = '__applyEvent';

function verifyCommand(command) {
    if (!command.__aggregateName) return Promise.reject('Miss __aggregateName argument');
    if (!command.__aggregateId) return Promise.reject('Miss __aggregateId argument');
    if (!command.__commandName) return Promise.reject('Miss __commandName argument');

    return Promise.resolve(command);
}

function getAggregateState(aggregate, aggregateId, store) {
    const initialStateFunc = aggregate[INITIAL_STATE_FUNC] || (() => ({}));
    const buildStateFunc = aggregate[BUILD_STATE_FUNC] || (state => state);

    let aggregateState = initialStateFunc();

    return store.loadEventsByAggregateId(aggregateId, (event) => {
        aggregateState = buildStateFunc(aggregateState, event);
    }).then(() => aggregateState);
}

function executeCommand(command, aggregates, store) {
    const aggregate = aggregates[command.__aggregateName];

    return getAggregateState(aggregate, command.__aggregateId, store)
        .then((aggregateState) => {
            const handler = aggregate[command.__commandName];
            const event = handler(aggregateState, command);
            return event;
        });
}

function saveEvent(event, store) {
    return store.saveEvent(event).then(() => event);
}

function publishEvent(event, bus) {
    bus.emitEvent(event);

    return Promise.resolve(event);
}

export default function ({ store, bus, aggregates }) {
    return rawCommand => verifyCommand(rawCommand)
        .then(command => executeCommand(command, aggregates, store))
        .then(event => saveEvent(event, store))
        .then(event => publishEvent(event, bus));
}
