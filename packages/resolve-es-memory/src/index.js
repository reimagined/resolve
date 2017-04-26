export default (events) => {
    const store = events || [];

    return {
        saveEvent: (event) => {
            store.push(event);
            return Promise.resolve();
        },

        loadEventsByTypes: (types, callback) => Promise.resolve(
            store.filter(event => types.includes(event.__type)).forEach(callback)
        ),

        loadEventsByAggregateId: (id, callback) => Promise.resolve(
            store.filter(event => event.__aggregateId === id).forEach(callback)
        )
    };
};
