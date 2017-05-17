function updateState(projection, event, state) {
    return projection.eventHandlers[event.type](state, event);
}

const executor = ({ store, bus, projection }) => {
    const eventTypes = Object.keys(projection.eventHandlers);
    const initialStateFunc = projection.initialState || (() => ({}));
    let state = initialStateFunc();

    const handler = event => (state = updateState(projection, event, state));

    let result = null;
    return () => {
        result =
            result ||
            store.loadEventsByTypes(eventTypes, handler).then(() => {
                bus.onEvent(eventTypes, handler);
            });

        return result.then(() => state);
    };
};

export default ({ store, bus, projections }) => {
    const executors = projections.reduce((result, projection) => {
        result[projection.name.toLowerCase()] = executor({
            store,
            bus,
            projection
        });
        return result;
    }, {});

    return name => executors[name.toLowerCase()]();
};
