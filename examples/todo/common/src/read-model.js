import Immutable from 'seamless-immutable';

const originalProjection = {
    TodoCardCreated: (state, event) =>
        state.setIn(['cards', event.aggregateId], {
            aggregateId: event.aggregateId,
            activated: true,
            name: event.payload.name,
            todoList: {}
        }),

    TodoCardRemoved: (state, event) =>
        state.setIn(['cards'], state.cards.without(event.aggregateId)),

    TodoItemCreated: (state, event) =>
        state
            .setIn(['cards', event.payload.cardId, 'todoList', event.aggregateId], {
                aggregateId: event.aggregateId,
                name: event.payload.name,
                checked: false
            })
            .setIn(['mapTodoToCard', event.aggregateId], event.payload.cardId),

    TodoItemRemoved: (state, event) =>
        state.setIn(
            ['cards', state.mapTodoToCard[event.aggregateId], 'todoList'],
            state.cards[state.mapTodoToCard[event.aggregateId]].todoList.without(event.aggregateId)
        ),

    TodoItemCheckToggled: (state, event) =>
        state.setIn(
            [
                'cards',
                state.mapTodoToCard[event.aggregateId],
                'todoList',
                event.aggregateId,
                'checked'
            ],
            !state.cards[state.mapTodoToCard[event.aggregateId]].todoList[event.aggregateId].checked
        )
};

export default {
    name: 'cards',
    viewModel: true,
    projection: Object.keys(originalProjection).reduce((result, name) => {
        result[name] = (state, event) => {
            const checkedState =
                !state || !state.cards || !state.mapTodoToCard
                    ? Immutable({ cards: {}, mapTodoToCard: {} })
                    : state;
            return originalProjection[name](checkedState, event);
        };
        return result;
    }, {})
};
