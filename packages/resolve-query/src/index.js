export default ({ eventStore, projection }) => {
    const eventsNames = Object.keys(projection.handlers);
    let state = projection.initialState;
    return () => eventStore.loadEventsByTypes(eventsNames, (event) => {
        state = projection.handlers[event.__type](state, event);
    }).then(() => state);
};
