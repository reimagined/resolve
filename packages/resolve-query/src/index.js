import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const createMemoryStorageAdapter = (storageRepository = {}) => ({
    initStorage(storageName, onPersistDone = () => {}, onDestroy = () => {}) {
        if (storageRepository[storageName]) {
            throw new Error(`State for read-model '${storageName}' alreary initialized`);
        }

        const stateManager = { internalState: null, internalError: null, onDestroy };
        const persistPromise = new Promise(resolve => onPersistDone(resolve));
        stateManager.api = {
            getReadable: async () => persistPromise.then(() => stateManager.internalState),
            getError: async () => stateManager.internalError
        };

        storageRepository[storageName] = stateManager;
        return stateManager;
    },

    wrapEventHandlers(eventHandlers) {
        return Object.keys(eventHandlers).reduce((result, handlerName) => {
            result[handlerName] = async (storage, event) => {
                const handler = eventHandlers[handlerName];
                if (!handler || storage.internalError) return;
                try {
                    storage.internalState = await handler(storage.internalState, event);
                } catch (error) {
                    storage.internalError = error;
                }
            };
            return result;
        }, {});
    },

    getStorage(storageName) {
        const stateManager = storageRepository[storageName];
        if (!stateManager) return null;
        return stateManager.api;
    },

    resetStorage(storageName) {
        if (!storageRepository[storageName]) return;
        storageRepository[storageName].onDestroy();
        storageRepository[storageName] = null;
    }
});

const subscribeByEventTypeAndIds = async (eventStore, callback, eventDescriptors) => {
    const passedEventSet = new WeakSet();

    const trigger = (event) => {
        if (!passedEventSet.has(event)) {
            passedEventSet.add(event);
            callback(event);
        }
    };

    const typeUnsubPromise = Array.isArray(eventDescriptors.types)
        ? eventStore.subscribeByEventType(eventDescriptors.types, trigger)
        : Promise.resolve(() => {});

    const idUnsubPromise = Array.isArray(eventDescriptors.ids)
        ? eventStore.subscribeByAggregateId(eventDescriptors.ids, trigger)
        : Promise.resolve(() => {});

    const [typeUnsub, idUnsub] = await Promise.all([typeUnsubPromise, idUnsubPromise]);

    return () => {
        typeUnsub();
        idUnsub();
    };
};

const readPartition = async (storageAdapter, eventStore, eventHandlers, onDemandOptions) => {
    const { aggregateIds, limitedEventTypes } = onDemandOptions || {};

    const partitionName =
        'STATE' +
        (Array.isArray(aggregateIds) ? `\u200D\u200D${aggregateIds.sort().join('\u200D')}` : '') +
        (Array.isArray(limitedEventTypes)
            ? `\u200D\u200D${limitedEventTypes.sort().join('\u200D')}`
            : '');

    let currentState = storageAdapter.getStorage(partitionName);
    if (!currentState) {
        let unsubscriber = null;
        let onDestroy = () => (unsubscriber === null ? (onDestroy = null) : unsubscriber());
        let persistenceDoneCallback = () => {};
        const onPersistDone = callback => (persistenceDoneCallback = callback || (() => {}));

        currentState = storageAdapter.initStorage(partitionName, onPersistDone, onDestroy);

        await new Promise((resolve) => {
            let persistence = { eventsFetched: 0, eventsProcessed: 0, isLoaded: false };
            let flowPromise = Promise.resolve();

            const persistenceChecker = (doCount) => {
                if (!persistence) return;
                if (doCount) {
                    persistence.eventsProcessed++;
                } else {
                    persistence.isLoaded = true;
                }
                if (
                    persistence.eventsProcessed === persistence.eventsFetched &&
                    persistence.isLoaded
                ) {
                    persistence = null;
                    resolve();
                }
            };

            const synchronizedEventWorker = (event) => {
                flowPromise = flowPromise.then(
                    eventHandlers[event.type].bind(null, currentState, event)
                );
                if (!persistence || persistence.isLoaded) return;
                persistence.eventsFetched++;
                flowPromise = flowPromise.then(persistenceChecker.bind(null, true));
            };

            subscribeByEventTypeAndIds(eventStore, synchronizedEventWorker, {
                types: Array.isArray(limitedEventTypes) || Array.isArray(aggregateIds)
                    ? limitedEventTypes
                    : Object.keys(eventHandlers),
                ids: aggregateIds
            }).then((unsub) => {
                persistenceChecker(false);

                if (onDestroy !== null) {
                    unsubscriber = unsub;
                } else {
                    unsub();
                }
            });
        });

        persistenceDoneCallback();
    }

    const readableError = await currentState.getError();
    if (readableError) {
        throw readableError;
    }

    return await currentState.getReadable();
};

const getReadModelExecutor = async (readModel, eventStore) => {
    const storageAdapter = readModel.storageAdapter || createMemoryStorageAdapter();
    const eventHandlers = storageAdapter.wrapEventHandlers(readModel.eventHandlers);
    const readState = readPartition.bind(null, storageAdapter, eventStore, eventHandlers);

    const executableSchema = makeExecutableSchema({
        resolvers: readModel.gqlResolvers ? { Query: readModel.gqlResolvers } : {},
        typeDefs: readModel.gqlSchema
    });

    return async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);

        const gqlResponse = await execute(
            executableSchema,
            parsedGqlQuery,
            readState,
            { getJwt },
            gqlVariables
        );

        if (gqlResponse.errors) throw gqlResponse.errors;
        return gqlResponse.data;
    };
};

const extractAggregateIdsFromGqlQuery = (parsedGqlQuery, gqlVariables) => {
    try {
        const aggregateIds = [];
        const selection = parsedGqlQuery.definitions[0].selectionSet.selections[0];
        if (selection.name.kind !== 'Name' || selection.name.value !== 'View') {
            throw new Error();
        }
        if (Array.isArray(selection.arguments)) {
            selection.arguments.forEach((arg) => {
                if (arg.name.kind !== 'Name' || arg.name.value !== 'aggregateId') {
                    throw new Error();
                }
                if (arg.value.kind === 'Variable' && arg.value.name && arg.value.name.value) {
                    aggregateIds.push(gqlVariables[arg.value.name.value]);
                } else {
                    aggregateIds.push(arg.value.value);
                }
            });
        }
        return aggregateIds.length > 0 ? aggregateIds : null;
    } catch (err) {
        throw new Error( // eslint-disable-next-line max-len
            'View model is queryable only by "query { View }" or "query { View(aggregateId: ID) }"'
        );
    }
};

const getViewModelExecutor = async (readModel, eventStore) => {
    if (readModel.gqlSchema || readModel.gqlResolvers) {
        throw new Error('View model can\'t have GraphQL schemas and resolvers');
    } else if (readModel.storageAdapter) {
        throw new Error('View model can\'t have custom storage Adapter');
    }

    const storageAdapter = createMemoryStorageAdapter();
    const eventHandlers = storageAdapter.wrapEventHandlers(readModel.eventHandlers);
    const readState = readPartition.bind(null, storageAdapter, eventStore, eventHandlers);

    return async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);
        return await readState({
            aggregateIds: extractAggregateIdsFromGqlQuery(parsedGqlQuery, gqlVariables)
        });
    };
};

export default ({ readModel, eventStore }) => {
    try {
        return readModel.viewModel
            ? getViewModelExecutor(readModel, eventStore)
            : getReadModelExecutor(readModel, eventStore);
    } catch (err) {
        throw new Error(`Error ${err.description} due query-side initialization: ${err.stack}`);
    }
};
