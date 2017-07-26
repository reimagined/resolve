import React from 'react';
import RootComponent from './index';
import { createStore } from 'redux';
import { BrowserRouter } from 'react-router-dom';

const emptyStore = () => createStore(() => ({}), {});

export default {
    rootComponent: () => <BrowserRouter><RootComponent /></BrowserRouter>,
    createStore: emptyStore
};
