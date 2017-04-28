const updateState = (projection, event, state) => projection.handlers[event.__type](state, event);

export default ({ store, bus, projection }) => {
    const eventsNames = Object.keys(projection.handlers);
    let state = projection.initialState();

    const handler = event => (state = updateState(projection, event, state));

    let result = null;
    return () => {
        result =
            result ||
            store.loadEventsByTypes(eventsNames, handler).then(() => {
                bus.onEvent(eventsNames, handler);
            });

        return result.then(() => state);
    };
};
