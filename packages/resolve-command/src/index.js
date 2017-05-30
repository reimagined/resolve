function verifyCommand(command) {
    if (!command.aggregateId)
        return Promise.reject(new Error('"aggregateId" argument is required'));
    if (!command.aggregateName)
        return Promise.reject(new Error('"aggregateName" argument is required'));
    if (!command.type) return Promise.reject(new Error('"type" argument is required'));

    return Promise.resolve(command);
}

function getAggregateState(aggregate, aggregateId, eventStore) {
    const handlers = aggregate.eventHandlers;
    let aggregateState = aggregate.initialState || {};

    if (!handlers) {
        return Promise.resolve(aggregateState);
    }

    return new Promise((resolve, reject) => {
        const eventStream = eventStore.getStreamByAggregateId(aggregateId);

        eventStream.on('readable', () => {
            let event;
            // eslint-disable-next-line no-cond-assign
            while (null !== (event = eventStream.read())) {
                const handler = handlers[event.type];
                if (handler) {
                    aggregateState = handler(aggregateState, event);
                }
            }
        });

        eventStream.on('end', () => resolve(aggregateState));

        eventStream.on('error', reject);
    });
}

async function executeCommand(command, aggregate, eventStore) {
    const aggregateState = await getAggregateState(aggregate, command.aggregateId, eventStore);

    const handler = aggregate.commands[command.type];
    const event = handler(aggregateState, command);

    if (!event.type) {
        throw new Error('event type is required');
    }

    event.aggregateId = command.aggregateId;
    event.timestamp = Date.now();
    return event;
}

function propagateEvent(event, publishStream) {
    return new Promise((resolve, reject) =>
        publishStream.write(event, err => (err ? reject(err) : resolve(event)))
    );
}

function createExecutor({ eventStore, aggregate, publishStream }) {
    return async (command) => {
        const event = await executeCommand(command, aggregate, eventStore);
        return await propagateEvent(event, publishStream);
    };
}

export default ({ eventStore, aggregates }) => {
    const publishStream = eventStore.getPublishStream();

    const executors = aggregates.reduce((result, aggregate) => {
        result[aggregate.name.toLowerCase()] = createExecutor({
            eventStore,
            aggregate,
            publishStream
        });
        return result;
    }, {});

    return command =>
        verifyCommand(command).then(() => executors[command.aggregateName.toLowerCase()](command));
};
