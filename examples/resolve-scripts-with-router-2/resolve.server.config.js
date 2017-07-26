import React from 'react';
import storageDriver from 'resolve-storage-memory';
import busDriver from 'resolve-bus-memory';
import { RouterContext, match, createRoutes } from 'react-router';

import rootRoute from './index';
import { createStore } from 'redux';

const emptyStore = () => createStore(() => ({}), {});

const ServerRouter = ({ url }) => {
    let jsx = null;

    match({ routes: createRoutes(rootRoute), location: url }, (error, redirect, renderProps) => {
        if (!error && !redirect && renderProps) {
            jsx = <RouterContext {...renderProps} />;
        } else {
            jsx = <div>Error {error}</div>;
        }
    });

    return jsx;
};

export default {
    entries: {
        rootComponent: ServerRouter,
        createStore: emptyStore
    },
    bus: { driver: busDriver },
    storage: { driver: storageDriver },
    aggregates: [],
    events: [],
    queries: []
};
