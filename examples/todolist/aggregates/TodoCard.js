import Immutable from 'seamless-immutable';

export default {
    initialState: () => null,

    eventHandlers: {
        TodoCardCreated: () => Immutable({ activated: true }),

        TodoCardRemoved: state => state.setIn(['activated'], false)
    },

    commands: {
        create: (state, args) => {
            if (!args.name) throw new Error('no-name');
            if (state && state.activated) throw new Error('already-exist');

            return {
                type: 'TodoCardCreated',
                payload: {
                    name: args.name
                }
            };
        },

        remove: (state) => {
            if (!state.activated) throw new Error('no-exist');

            return {
                type: 'TodoCardRemoved'
            };
        }
    }
};
