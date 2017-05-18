export default  {
    TodoCardCreated: (state, action) =>
        state.setIn(['cards', action.event.aggregateId], {
            aggregateId: action.event.aggregateId,
            activated: true,
            name: action.event.payload.name,
            todoList: {}
        })
}
