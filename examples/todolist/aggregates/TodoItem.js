import Immutable from 'seamless-immutable';

export default {
    initialState: () => null,

    handlers: {
        TodoItemCreated: (state, event) =>
            Immutable({ activated: true, cardId: event.cardId }),

        TodoItemRemoved: state =>
            state.setIn(['activated'], false)
    },

    commands: {
        create: (state, args) => {
            if (!args.cardId) throw new Error('no-cardid');
            if (!args.name) throw new Error('no-name');
            if (state && state.activated) throw new Error('already-exist');

            return {
                __type: 'TodoItemCreated',
                name: args.name,
                cardId: args.cardId
            };
        },

        rename: (state, args) => {
            if (!args.name) throw new Error('no-name');
            if (!state.activated) throw new Error('no-exist');

            return {
                __type: 'TodoItemRenamed',
                name: args.name
            };
        },

        remove: (state) => {
            if (!state.activated) throw new Error('no-exist');

            return {
                __type: 'TodoItemRemoved'
            };
        },

        toggleCheck: (state) => {
            if (!state.activated) throw new Error('no-exist');

            return {
                __type: 'TodoItemCheckToggled'
            };
        }
    }
};
