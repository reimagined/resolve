import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const createMemoryStorageProvider = (readModelsStateRepository = {}) => ({
    async initState(stateName, readModel) {
        if (readModelsStateRepository[stateName]) {
            throw new Error(`State for read-model '${stateName}' alreary initialized`);
        }

        let state = readModel.initialState;
        let error = null;

        readModelsStateRepository[stateName] = {
            internal: {
                setState: newState => (state = newState),
                getState: () => state,
                setError: newError => (error = newError),
                getError: () => error
            },
            public: {
                getReadable: async () => state,
                getError: async () => error
            }
        };

        return readModelsStateRepository[stateName].public;
    },

    async getEventWorker(stateName, readModel) {
        return async (event) => {
            if (!readModelsStateRepository[stateName]) {
                throw new Error(
                    `State for read-model ${stateName} is not initialized or been reset`
                );
            }
            const stateManager = readModelsStateRepository[stateName].internal;
            const handler = readModel.eventHandlers[event.type];
            if (!handler || stateManager.getError()) return;

            try {
                const currentState = stateManager.getState();
                const newState = await handler(currentState, event);
                stateManager.setState(newState);
            } catch (err) {
                stateManager.setError(err);
            }
        };
    },

    async getState(stateName) {
        const stateManager = readModelsStateRepository[stateName];
        if (!stateManager) return null;
        return stateManager.public;
    },

    async resetState(stateName) {
        readModelsStateRepository[stateName] = null;
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
        ? eventStore.subscribeByEventType(eventDescriptors.types, trigger, true)
        : Promise.resolve(() => {});

    const idUnsubPromise = Array.isArray(eventDescriptors.ids)
        ? eventStore.subscribeByAggregateId(eventDescriptors.ids, trigger, true)
        : Promise.resolve(() => {});

    const [typeUnsub, idUnsub] = await Promise.all([typeUnsubPromise, idUnsubPromise]);

    return () => {
        typeUnsub();
        idUnsub();
    };
};

const getState = async (storageProvider, eventStore, readModel, onDemandOptions) => {
    const { aggregateIds, limitedEventTypes } = onDemandOptions || {};

    let stateName = readModel.name.toLowerCase();
    if (Array.isArray(aggregateIds)) {
        stateName = `${stateName}\u200D\u200D${aggregateIds.sort().join('\u200D')}`;
    }
    if (Array.isArray(limitedEventTypes)) {
        stateName = `${stateName}\u200D\u200D${limitedEventTypes.sort().join('\u200D')}`;
    }

    let currentState = await storageProvider.getState(stateName);
    if (!currentState) {
        currentState = await storageProvider.initState(stateName, readModel);
        const eventWorker = await storageProvider.getEventWorker(stateName, readModel);

        await new Promise((resolve) => {
            let persistense = { lastLoadedEvent: null, borderEvent: null };
            let flowPromise = Promise.resolve();
            let unsubscriber = null;

            const synchronizedEventWorker = (event) => {
                flowPromise = flowPromise.then(eventWorker.bind(null, event));

                if (persistense) {
                    persistense.lastLoadedEvent = event;
                    flowPromise = flowPromise.then(() => {
                        if (persistense && event === persistense.borderEvent) {
                            persistense = null;
                            resolve(unsubscriber);
                        }
                    });
                }
            };

            subscribeByEventTypeAndIds(eventStore, synchronizedEventWorker, {
                types: Array.isArray(limitedEventTypes) || Array.isArray(aggregateIds)
                    ? limitedEventTypes
                    : Object.keys(readModel.eventHandlers),
                ids: aggregateIds
            }).then((unsub) => {
                persistense.borderEvent = persistense.lastLoadedEvent;
                unsubscriber = unsub;
            });
        });
    }

    const readableError = await currentState.getError();
    if (readableError) {
        throw readableError;
    }

    return await currentState.getReadable();
};

const createExecutor = (eventStore, readModel) => {
    const storageProvider = readModel.storageProvider || createMemoryStorageProvider();
    const readState = getState.bind(null, storageProvider, eventStore, readModel);

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

export default ({ eventStore, readModel }) => {
    try {
        return createExecutor(eventStore, readModel);
    } catch (err) {
        throw new Error(`Error ${err.description} due query-side initialization: ${err.stack}`);
    }
};
