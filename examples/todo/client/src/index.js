import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import store from './store';
import App from './containers/App';
import TaskList from './containers/TaskList';

import './index.css';

const target = document.querySelector('#root');

render(
    <Provider store={store}>
        <Router>
            <Route
                path="/:cardId?"
                render={() =>
                    <App>
                        <TaskList />
                    </App>}
            />
        </Router>
    </Provider>,
    target
);
