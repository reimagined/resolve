import Immutable from 'seamless-immutable';

export default {
    initialState: () => Immutable({}),

    handlers: {
        TodoCardCreated: (state, event) =>
            state.setIn([event.__aggregateId], {
                aggregateId: event.__aggregateId,
                activated: true,
                name: event.name
            }),

        TodoCardRenamed: (state, event) =>
            state.setIn([event.__aggregateId, 'name'], event.name),

        TodoCardRemoved: (state, event) =>
                state.without(event.__aggregateId)
    }
};
