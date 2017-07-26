import React from 'react';
import { createStore } from 'redux';
import defaultStorageDriver from 'resolve-storage-memory';
import defaultBusDriver from 'resolve-bus-memory';
import deepAssign from 'deep-assign';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_SERVER_CONFIG';

const emptyRootComponent = () =>
    <div>No root component provided! Please set it in resolve.server.config.js</div>;
const emptyCreateStore = () => createStore(() => ({}), {});

const defaultConfig = {
    entries: {
        rootComponent: emptyRootComponent,
        createStore: emptyCreateStore
    },
    bus: {
        driver: defaultBusDriver
    },
    storage: {
        driver: defaultStorageDriver
    },
    initialReadModels: [],
    aggregates: [],
    events: [],
    queries: [],
    extendExpress: () => {}
};

export default deepAssign({}, defaultConfig, config);
