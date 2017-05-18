export function updateCards(cards) {
    return {
        type: 'CARDS_UPDATED',
        cards
    }
}

export function TodoCardCreate(name) {
    return {
        aggregateName: 'todocard',
        type: 'create',
        name
    }
}
