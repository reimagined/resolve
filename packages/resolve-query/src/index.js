import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const createMemoryStorageProvider = (readModelsStateRepository = {}) => ({
    async initState(stateName, readModel, onDestroy = () => {}) {
        if (readModelsStateRepository[stateName]) {
            throw new Error(`State for read-model '${stateName}' alreary initialized`);
        }

        let state = null,
            error = null;

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
            },
            onDestroy
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
        if (!readModelsStateRepository[stateName]) return;
        readModelsStateRepository[stateName].onDestroy();
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
        let unsubscriber = null;
        let onDestroy = () => (unsubscriber === null ? (onDestroy = null) : unsubscriber());

        currentState = await storageProvider.initState(stateName, readModel, onDestroy);
        const eventWorker = await storageProvider.getEventWorker(stateName, readModel);

        await new Promise((resolve) => {
            let persistence = { eventsFetched: 0, eventsProcessed: 0, isLoaded: false };
            let flowPromise = Promise.resolve();

            const synchronizedEventWorker = (event) => {
                flowPromise = flowPromise.then(eventWorker.bind(null, event));

                if (persistence && !persistence.isLoaded) {
                    persistence.eventsFetched++;
                    flowPromise = flowPromise.then(() => {
                        if (!persistence) return;
                        persistence.eventsProcessed++;

                        if (
                            persistence.eventsProcessed === persistence.eventsFetched &&
                            persistence.isLoaded
                        ) {
                            persistence = null;
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
                persistence.isLoaded = true;

                if (onDestroy !== null) {
                    unsubscriber = unsub;
                } else {
                    unsub();
                }

                if (
                    persistence.eventsProcessed === persistence.eventsFetched &&
                    persistence.isLoaded
                ) {
                    persistence = null;
                    resolve(unsubscriber);
                }
            });
        });
    }

    const readableError = await currentState.getError();
    if (readableError) {
        throw readableError;
    }

    return await currentState.getReadable();
};

const readModelReader = async (executableSchema, readState, gqlQuery, gqlVariables, getJwt) => {
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

const viewModelReader = async (readState, gqlQuery, gqlVariables, getJwt) => {
    const parsedGqlQuery = parse(gqlQuery);
    const aggregateIds = [];

    try {
        const viewQueryError = new Error();
        const selection = parsedGqlQuery.definitions[0].selectionSet.selections[0];
        if (selection.name.kind !== 'Name' || selection.name.value !== 'View') {
            throw viewQueryError;
        }
        if (Array.isArray(selection.arguments)) {
            selection.arguments.forEach((arg) => {
                if (arg.name.kind !== 'Name' || arg.name.value !== 'aggregateId') {
                    throw viewQueryError;
                }
                if (arg.value.kind === 'Variable' && arg.value.name && arg.value.name.value) {
                    aggregateIds.push(gqlVariables[arg.value.name.value]);
                } else {
                    aggregateIds.push(arg.value.value);
                }
            });
        }
    } catch (err) {
        throw new Error( // eslint-disable-next-line max-len
            'View model is queryable only by "query { Read }" or "query { Read(aggregateId: ID) }"'
        );
    }

    return await readState({ aggregateIds });
};

const createExecutor = (eventStore, readModel) => {
    if (readModel.viewModel) {
        if (readModel.gqlSchema || readModel.gqlResolvers) {
            throw new Error('View model can\'t have GraphQL schemas and resolvers');
        } else if (readModel.storageProvider) {
            throw new Error('View model can\'t have custom storage provider');
        }

        const readState = getState.bind(null, createMemoryStorageProvider(), eventStore, readModel);
        return viewModelReader.bind(null, readState);
    }

    const storageProvider = readModel.storageProvider || createMemoryStorageProvider();
    const readState = getState.bind(null, storageProvider, eventStore, readModel);

    const executableSchema = makeExecutableSchema({
        resolvers: readModel.gqlResolvers ? { Query: readModel.gqlResolvers } : {},
        typeDefs: readModel.gqlSchema
    });

    return readModelReader.bind(null, executableSchema, readState);
};

export default ({ eventStore, readModel }) => {
    try {
        return createExecutor(eventStore, readModel);
    } catch (err) {
        throw new Error(`Error ${err.description} due query-side initialization: ${err.stack}`);
    }
};
