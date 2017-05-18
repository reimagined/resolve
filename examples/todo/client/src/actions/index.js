export function setState(state) {
    return {
        type: 'stateSet',
        state
    }
}

export function createTodoCard(name) {
    return {
        aggregateName: 'todocard',
        type: 'create',
        name
    }
}

export function todoCardCreated(event) {
    return {
        type: 'TodoCardCreated',
        event
    }
}
