function updateState(projection, event, state) {
    return projection.handlers[event.__type](state, event);
}

const executor = ({ store, bus, projection }) => {
    const eventTypes = Object.keys(projection.handlers);
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
    const names = Object.keys(projections);
    const executors = names.reduce((result, name) => {
        result[name] = executor({ store, bus, projection: projections[name] });
        return result;
    }, {});

    return name => executors[name]();
};
