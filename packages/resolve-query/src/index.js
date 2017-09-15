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
        return async () => {
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

const getState = async (storageProvider, eventStore, readModel, aggregateIds) => {
    const readModelName = readModel.name.toLowerCase();
    const isAggregateBased = Array.isArray(aggregateIds) && aggregateIds.length > 0;

    const stateName = isAggregateBased
        ? `${readModelName}\u200D${aggregateIds.sort().join('\u200D')}`
        : readModelName;

    let currentState = await storageProvider.getState(stateName);
    if (!currentState) {
        currentState = await storageProvider.initState(stateName, readModel);
        const eventWorker = await storageProvider.getEventWorker(stateName, readModel);

        await new Promise((resolve) => {
            let persistense = { lastLoadedEvent: null, borderEvent: null };
            let flowPromise = Promise.resolve();

            const synchronizedEventWorker = (event) => {
                flowPromise = flowPromise.then(eventWorker.bind(null, event));

                if (persistense) {
                    persistense.lastLoadedEvent = event;
                    flowPromise = flowPromise.then(() => {
                        if (persistense && event === persistense.borderEvent) {
                            persistense = null;
                            resolve();
                        }
                    });
                }
            };

            if (isAggregateBased) {
                eventStore
                    .subscribeByAggregateId(aggregateIds, synchronizedEventWorker)
                    .then(() => (persistense.borderEvent = persistense.lastLoadedEvent));
            } else {
                eventStore
                    .subscribeByEventType(
                        Object.keys(readModel.eventHandlers),
                        synchronizedEventWorker
                    )
                    .then(() => (persistense.borderEvent = persistense.lastLoadedEvent));
            }
        });
    }

    const readableError = await currentState.getError();
    if (readableError) {
        throw readableError;
    }

    return await currentState.getReadable();
};

const createExecutor = (eventStore, queryDefinition) => {
    const {
        graphql: { gqlSchema, gqlResolvers } = {},
        storageProvider = createMemoryStorageProvider(),
        readModels
    } = queryDefinition;

    const normalizedModelMap = readModels.reduce(
        (map, model) => map.set(model.name.toLowerCase(), model),
        new Map()
    );

    const getReadModel = async (modelName, aggregateIds) => {
        const readModel = normalizedModelMap.get(modelName.toLowerCase());
        if (readModel) {
            return await getState(storageProvider, eventStore, readModel, aggregateIds);
        }
        return null;
    };

    const executableSchema = makeExecutableSchema({
        resolvers: gqlResolvers ? { Query: gqlResolvers } : {},
        typeDefs: gqlSchema
    });

    return async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);

        const gqlResponse = await execute(
            executableSchema,
            parsedGqlQuery,
            getReadModel,
            { getJwt },
            gqlVariables
        );

        if (gqlResponse.errors) throw gqlResponse.errors;
        return gqlResponse.data;
    };
};

export default ({ eventStore, queryDefinition }) => {
    try {
        return createExecutor(eventStore, queryDefinition);
    } catch (err) {
        throw new Error(`Error ${err.description} due query-side initialization: ${err.stack}`);
    }
};
