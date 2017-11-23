export default [
    {
        name: 'Todo',
        commands: {
            createTodo: (_, { payload: { id, text } }) => ({
                type: 'TODO_CREATED',
                payload: { id, text }
            }),
            toggleTodo: (_, { payload: { id } }) => ({
                type: 'TODO_TOGGLED',
                payload: { id }
            }),
            removeTodo: (_, { payload: { id } }) => ({
                type: 'TODO_REMOVED',
                payload: { id }
            })
        }
    }
];
