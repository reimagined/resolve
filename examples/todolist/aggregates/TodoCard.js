import Immutable from 'seamless-immutable';

export default {
    initialState: () => null,

    handlers: {
        TodoCardCreated: () =>
            Immutable({ activated: true }),

        TodoCardRemoved: state =>
            state.setIn(['activated'], false)
    },

    commands: {
        create: (state, args) => {
            if (!args.name) throw new Error('no-name');
            if (state && state.activated) throw new Error('already-exist');

            return {
                __type: 'TodoCardCreated',
                name: args.name
            };
        },

        rename: (state, args) => {
            if (!args.name) throw new Error('no-name');
            if (!state.activated) throw new Error('no-exist');

            return {
                __type: 'TodoCardRenamed',
                name: args.name
            };
        },

        remove: (state) => {
            if (!state.activated) throw new Error('no-exist');

            return {
                __type: 'TodoCardRemoved'
            };
        }
    }
};
