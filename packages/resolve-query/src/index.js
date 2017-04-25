export default ({ eventStore, projection }) => {
    const eventsNames = Object.keys(projection.handlers);
    let events = [];
    return () => eventStore.loadEventsByTypes(eventsNames, (partEvents) => {
        events = events.concat(partEvents);
    }).then(() => events.reduce((state, e) =>
        projection.handlers[e.__type](state, e), projection.initialState));
};
