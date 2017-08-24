import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import socketIOClient from 'socket.io-client';

import clientConfig from './configs/client.config';

const { rootComponent: RootComponent, createStore } = clientConfig;

const store = createStore(window.__INITIAL_STATE__);
const CRITICAL_LEVEL = 100;
let socketIOFailCount = 0;

function listenStore(store, listener) {
    if (store.dispatch.listenFlag === listenStore) {
        store.dispatch.setListener(listener);
        return;
    }

    const originalDispatch = store.dispatch;
    let currentListener = listener;
    store.dispatch = (...args) => {
        Promise.resolve().then(() => currentListener(...args));
        return originalDispatch(...args);
    };

    store.dispatch.listenFlag = listenStore;
    store.dispatch.setListener = (newListener) => {
        currentListener = newListener;
    };
}

function initSocketIO(store) {
    const socketIO = socketIOClient(window.location.origin, {
        path: `${process.env.ROOT_DIR}/socket/`
    });

    listenStore(store, (action) => {
        if (action.type === 'SET_SUBSCRIPTION') {
            socketIO.emit('setSubscription', {
                types: action.types || [],
                ids: action.ids || []
            });
        }
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
