import React from 'react';
import { createStore } from 'redux';
import defaultStorageAdapter from 'resolve-storage-lite';
import defaultBusAdapter from 'resolve-bus-memory';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_SERVER_CONFIG';

const emptyRootComponent = () => (
    <div>No root component provided! Please set it in resolve.server.config.js</div>
);
const emptyCreateStore = () => createStore(() => ({}), {});

const defaultConfig = {
    entries: {
        rootComponent: emptyRootComponent,
        createStore: emptyCreateStore
    },
    bus: {
        adapter: defaultBusAdapter
    },
    storage: {
        adapter: defaultStorageAdapter
    },
    initialState: () => Promise.resolve({}),
    aggregates: [],
    initialSubscribedEvents: { types: [], ids: [] },
    filterSubscription: eventDescription => eventDescription,
    jwt: {
        cookieName: 'Jwt-Cookie',
        options: { maxAge: 1000 * 60 * 5 },
        secret: 'Keyboard-Kat'
    },
    passport: {
        strategies: [],
        authMiddleware: null,
        authRoutes: []
    },
    readModels: [],
    viewModels: [],
    extendExpress: () => {}
};

function extendConfig(inputConfig, defaultConfig) {
    const config = { ...inputConfig };

    Object.keys(defaultConfig).forEach((key) => {
        if (!config[key]) {
            config[key] = defaultConfig[key];
        } else if (defaultConfig[key].constructor === Object) {
            Object.keys(defaultConfig[key]).forEach((innerKey) => {
                if (!config[key][innerKey]) {
                    config[key][innerKey] = defaultConfig[key][innerKey];
                }
            });
        }
    });

    return config;
}

export default extendConfig(config, defaultConfig);
