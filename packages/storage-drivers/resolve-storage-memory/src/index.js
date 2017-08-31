const compareEvents = (a, b) => a.timestamp - b.timestamp;

function createDriver(events) {
    const store = events || [];

    return {
        saveEvent: (event) => {
            store.push(event);
            return Promise.resolve();
        },

        loadEventsByTypes: (types, callback) =>
            Promise.resolve(
                store
                    .filter(event => types.includes(event.type))
                    .sort(compareEvents)
                    .forEach(callback)
            ),

        loadEventsByAggregateId: (ids, callback) =>
            Promise.resolve(
                store
                    .filter(event => ids.includes(event.aggregateId))
                    .sort(compareEvents)
                    .forEach(callback)
            )
    };
}

export default createDriver;
