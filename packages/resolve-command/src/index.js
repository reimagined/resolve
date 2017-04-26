const INITIAL_STATE_FUNC = '__initialState';
const BUILD_STATE_FUNC = '__applyEvent';

function getAggregateState(aggregate, aggregateId, store) {
    const initialStateFunc = aggregate[INITIAL_STATE_FUNC] || (() => ({}));
    const buildStateFunc = aggregate[BUILD_STATE_FUNC] || (state => state);

    let aggregateState = initialStateFunc();

    return store.loadEventsByAggregateId(aggregateId, (event) => {
        aggregateState = buildStateFunc(aggregateState, event);
    });
}

function verifyCommand(command) {
    const aggregateName = command.__aggregateName;
    const aggregateId = command.__aggregateId;
    const commandName = command.__commandName;

    if (!aggregateName) return Promise.reject('Miss __aggregateName argument');

    if (!aggregateId) return Promise.reject('Miss __aggregateId argument');

    if (!commandName) return Promise.reject('Miss __commandName argument');

    return Promise.resolve({ aggregateName, aggregateId, commandName });
}

export default function ({ store, bus, aggregates }) {
    return command => verifyCommand(command)
        .then(({ aggregateName, aggregateId, commandName }) => {
            const aggregate = aggregates[aggregateName];

            return getAggregateState(aggregate, aggregateId, store)
                .then((aggregateState) => {
                    const handler = aggregate[commandName];
                    const event = handler(aggregateState, command);
                    return event;
                })
                .then(event =>
                    store.saveEvent(event).then(
                        () => bus.emitEvent(event)
                    )
                );
        });
}
