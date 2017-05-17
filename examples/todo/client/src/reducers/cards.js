import Immutable from 'seamless-immutable';

const intialState = Immutable({
    '96a94552-ac4d-4c25-915e-a5505b92f1e7': {
        aggregateId: '96a94552-ac4d-4c25-915e-a5505b92f1e7',
        activated: true,
        name: 'Today',
        todoList: [
            {
                '0f126547-c576-4d1b-b72f-2e8187b27c51': {
                    name: 'Make a router',
                    checked: false
                }
            }
        ]
    },
    '841526b1-9337-48be-98f5-093acf26664c': {
        aggregateId: '841526b1-9337-48be-98f5-093acf26664c',
        activated: true,
        name: 'Inbox',
        todoList: {}
    }
});

export default function(state = intialState, action) {
    switch (action.type) {
        default: {
            return state;
        }
    }
}
