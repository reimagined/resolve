const updateState = (projection, event, state) =>
    projection.handlers[event.__type](state, event);

export default ({ eventStore, eventBus, projection }) => {
    const eventsNames = Object.keys(projection.handlers);
    let state = projection.initialState;

    const handler = event => (state = updateState(projection, event, state));
    eventBus.onEvent(eventsNames, handler);

    let firstCall = true;
    return () => (
        firstCall
            ? eventStore.loadEventsByTypes(eventsNames, handler)
                .then(() => {
                    firstCall = false;
                    return state;
                })
            : Promise.resolve(state)
    );
};
