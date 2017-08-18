import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import socketIOClient from 'socket.io-client';

import clientConfig from './configs/client.config';

const { rootComponent: RootComponent, createStore } = clientConfig;

const store = createStore(window.__INITIAL_STATE__);
const CRITICAL_LEVEL = 100;
let socketIOFailCount = 0;

function initSocketIO(store) {
    const socketIO = socketIOClient(window.location.origin, {
        path: `${process.env.ROOT_DIR}/socket/`
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
