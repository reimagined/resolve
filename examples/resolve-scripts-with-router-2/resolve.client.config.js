import React from 'react';
import rootRoute from './index';
import { createStore } from 'redux';
import { Router, browserHistory } from 'react-router';

const emptyStore = () => createStore(() => ({}), {});

export default {
    rootComponent: () => <Router history={browserHistory}>{rootRoute}</Router>,
    createStore: emptyStore
};
