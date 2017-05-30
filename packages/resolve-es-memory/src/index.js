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

        loadEventsByAggregateId: (id, callback) =>
            Promise.resolve(
                store
                    .filter(event => event.aggregateId === id)
                    .sort(compareEvents)
                    .forEach(callback)
            )
    };
}

module.exports = createDriver;
export default createDriver;
