import Immutable from 'seamless-immutable';

export default function (state = Immutable({}), action) {
    switch (action.type) {
        case 'CARDS_UPDATED': {
            return Immutable(action.cards);
        }
        default: {
            return state;
        }
    }
}
