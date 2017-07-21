import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import socketIOClient from 'socket.io-client';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import clientConfig from 'RESOLVE_CLIENT_CONFIG';

const { rootComponent: RootComponent, createStore } = clientConfig;

const store = createStore(window.__INITIAL_STATE__);
const CRITICAL_LEVEL = 100;
let socketIOFailCount = 0;

function initSocketIO(store) {
    const socketIO = socketIOClient(window.location.origin, {
        path: `${window.__ROOT_DIRECTORY__}/socket/`
    });

    socketIO.on('event', event => store.dispatch(JSON.parse(event)));

    socketIO.on('disconnect', () => {
        socketIOFailCount++;
        if (socketIOFailCount > CRITICAL_LEVEL) {
            window.location.reload();
        }
        initSocketIO(store);
    });
}

initSocketIO(store);

render(
    <Provider store={store}>
        <RootComponent />
    </Provider>,
    document.getElementById('root')
);
