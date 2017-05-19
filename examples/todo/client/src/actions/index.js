export function createTodoCard(name) {
    return {
        aggregateName: 'todocard',
        type: 'create',
        name
    };
}

export function removeTodoCard(id) {
    return {
        aggregateName: 'todocard',
        type: 'remove',
        aggregateId: id
    };
}

export function createTodoItem(name, cardId) {
    return {
        aggregateName: 'todoitem',
        type: 'create',
        name,
        cardId
    };
}

export function removeTodoItem(id) {
    return {
        aggregateName: 'todoitem',
        type: 'remove',
        aggregateId: id
    };
}
