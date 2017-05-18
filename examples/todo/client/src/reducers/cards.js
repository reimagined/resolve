import Immutable from 'seamless-immutable';

export default function(state = Immutable({}), action) {
    switch (action.type) {
        case 'CARDS_UPDATED': {
            return Immutable(action.cards)
        }
        case 'TodoCardCreated': {
            return state.set(action.event.aggregateId, {
                aggregateId: action.event.aggregateId,
                activated: true,
                name: action.event.payload.name,
                todoList: {}
            })
        }
        default: {
            return state;
        }
    }
}
