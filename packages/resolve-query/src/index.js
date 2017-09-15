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

        const stateManager = {
            setState: async newState => (state = newState),
            getState: async () => state,
            setError: async newError => (error = newError),
            getError: async () => error
        };

        readModelsStateRepository[stateName] = stateManager;

        return {
            getReadable: stateManager.getState,
            getError: stateManager.getError
        };
    },

    async getEventWorker(stateName, readModel) {
        return async () => {
            if (!readModelsStateRepository[stateName]) {
                throw new Error(
                    `State for read-model ${stateName} is not initialized or been reset`
                );
            }
            const stateManager = readModelsStateRepository[stateName];
            const handler = readModel.eventHandlers[event.type];
            if (!handler || (await stateManager.getError())) return;

            try {
                const currentState = await stateManager.getWritableState();
                const newState = await handler(currentState, event);
                await stateManager.setState(newState);
            } catch (err) {
                await stateManager.setError(err);
            }
        };
    },

    async getState(stateName) {
        const stateManager = readModelsStateRepository[stateName];
        if (!stateManager) return null;

        return {
            getReadable: stateManager.getState,
            getError: stateManager.getError
        };
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
            let flowPromise = Promise.resolve();
            let lastLoadedEvent = null;
            let lastPersistentEvent = null;

            const synchronizedEventWorker = (event) => {
                lastLoadedEvent = event;
                flowPromise = flowPromise
                    .then(eventWorker.bind(null, event))
                    .then(() => event === lastPersistentEvent && resolve());
            };

            if (isAggregateBased) {
                eventStore
                    .subscribeByAggregateId(aggregateIds, synchronizedEventWorker)
                    .then(() => (lastPersistentEvent = lastLoadedEvent));
            } else {
                eventStore
                    .subscribeByEventType(
                        Object.keys(readModel.eventHandlers),
                        synchronizedEventWorker
                    )
                    .then(() => (lastPersistentEvent = lastLoadedEvent));
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
