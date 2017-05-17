import Immutable from 'seamless-immutable';

export default {
    name: 'TodoItem',
    initialState: () => null,

    eventHandlers: {
        TodoItemCreated: (state, event) => Immutable({ activated: true, cardId: event.cardId }),

        TodoItemRemoved: state => state.setIn(['activated'], false)
    },

    commands: {
        create: (state, args) => {
            if (!args.cardId) throw new Error('no-cardid');
            if (!args.name) throw new Error('no-name');
            if (state && state.activated) throw new Error('already-exist');

            return {
                type: 'Created',
                payload: {
                    name: args.name,
                    cardId: args.cardId
                }
            };
        },

        remove: (state) => {
            if (!state.activated) throw new Error('no-exist');

            return {
                type: 'Removed'
            };
        },

        toggleCheck: (state) => {
            if (!state.activated) throw new Error('no-exist');

            return {
                type: 'CheckToggled'
            };
        }
    }
};
