export default ({ eventStore, projection }) => {
    const eventsNames = Object.keys(projection.handlers);
    let events = [];
    return () => eventStore.loadEventsByTypes(eventsNames, (partEvents) => {
        events = events.concat(partEvents);
    }).then(() => {
        let state = projection.initialState;
        events.forEach(e => (state = projection.handlers[e.__type](state, e)));
        return state;
    });
};
