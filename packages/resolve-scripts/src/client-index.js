import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import clientConfig from './configs/client.config';

const { rootComponent: RootComponent, createStore } = clientConfig;
const store = createStore(window.__INITIAL_STATE__);

render(
    <Provider store={store}>
        <RootComponent />
    </Provider>,
    document.getElementById('root')
);
