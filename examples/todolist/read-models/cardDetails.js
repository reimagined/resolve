import Immutable from 'seamless-immutable';

export default {
    initialState: () => Immutable({ cards: {}, mapTodoToCard: {} }),

    handlers: {
        TodoCardCreated: (state, event) =>
            state.setIn(['cards', event.__aggregateId], {
                aggregateId: event.__aggregateId,
                activated: true,
                name: event.name,
                todoList: {}
            }),

        TodoCardRenamed: (state, event) =>
            state.setIn(['cards', event.__aggregateId, 'name'], event.name),

        TodoCardRemoved: (state, event) =>
            state.setIn(
                ['cards'],
                state.cards.without(event.__aggregateId)
            ),

        TodoItemCreated: (state, event) =>
            state.setIn(
                ['cards', event.cardId, 'todoList', event.__aggregateId], {
                    aggregateId: event.__aggregateId,
                    name: event.name,
                    checked: false
                })
            .setIn(['mapTodoToCard', event.__aggregateId],
                event.cardId
            ),

        TodoItemRenamed: (state, event) =>
            state.setIn(
                [
                    'cards',
                    state.mapTodoToCard[event.__aggregateId],
                    'todoList',
                    event.__aggregateId,
                    'name'
                ],
                event.name
            ),

        TodoItemRemoved: (state, event) =>
            state.setIn(
                [
                    'cards',
                    state.mapTodoToCard[event.__aggregateId],
                    'todoList'
                ],
                state
                    .cards[state.mapTodoToCard[event.__aggregateId]]
                    .todoList
                    .without(event.__aggregateId)
            ),

        TodoItemCheckToggled: (state, event) =>
            state.setIn(
                [
                    'cards',
                    state.mapTodoToCard[event.__aggregateId],
                    'todoList',
                    event.__aggregateId,
                    'checked'
                ],
                !state
                    .cards[state.mapTodoToCard[event.__aggregateId]]
                    .todoList[event.__aggregateId]
                    .checked
            )
    }
};
