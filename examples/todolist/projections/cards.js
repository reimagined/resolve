import Immutable from 'seamless-immutable';

export default {
    name: 'cards',
    initialState: Immutable({}),

    eventHandlers: {
        TodoCardCreated: (state, event) =>
            state.setIn([event.aggregateId], {
                aggregateId: event.aggregateId,
                activated: true,
                name: event.payload.name
            }),

        TodoCardRemoved: (state, event) => state.without(event.aggregateId)
    }
};
