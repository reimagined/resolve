export default {
    TodoCardCreated(state, action) {
        return state.setIn(['cards', action.aggregateId], {
            aggregateId: action.aggregateId,
            activated: true,
            name: action.payload.name,
            todoList: {}
        });
    },
    TodoCardRemoved(state, action) {
        return state.update('cards', cards => cards.without(action.aggregateId));
    }
};
