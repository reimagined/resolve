export function updateCards(cards) {
    return {
        type: 'CARDS_UPDATED',
        cards
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
