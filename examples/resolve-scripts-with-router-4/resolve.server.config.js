import React from 'react';
import { StaticRouter } from 'react-router';
import storageDriver from 'resolve-storage-memory';
import busDriver from 'resolve-bus-memory';

import RootComponent from './index';
import { createStore } from 'redux';

const emptyStore = () => createStore(() => ({}), {});

export default {
    entries: {
        rootComponent: (props, context) =>
            <StaticRouter location={props.url} context={{}}>
                <RootComponent />
            </StaticRouter>,
        createStore: emptyStore
    },
    bus: { driver: busDriver },
    storage: { driver: storageDriver },
    aggregates: [],
    events: [],
    queries: []
};
