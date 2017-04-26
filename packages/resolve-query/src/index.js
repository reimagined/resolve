const updateState = (projection, event, state) =>
    projection.handlers[event.__type](state, event);

export default ({ eventStore, eventBus, projection }) => {
    const eventsNames = Object.keys(projection.handlers);
    let state = projection.initialState;

    let firstCall = true;
    return () => {
        if (firstCall) {
            firstCall = false;
            return eventStore.loadEventsByTypes(eventsNames, event =>
                (state = updateState(projection, event, state)))
                .then(() => {
                    eventBus.onEvent(eventsNames, (event) => {
                        state = updateState(projection, event, state);
                    });
                    return state;
                });
        }
        return Promise.resolve(state);
    };
};
