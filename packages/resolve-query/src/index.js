import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const createMemoryStorageProvider = (readModelsStateRepository = {}) => ({
    async init({ stateName, readModel }) {
        if (readModelsStateRepository[name]) {
            throw new Error(`State for read-model '${stateName}' alreary initialized`);
        }

        const { initialState, eventHandlers } = readModel;
        let state = initialState;
        let error = null;

        let flowPromise = Promise.resolve();
        const eventWorker = event =>
            (flowPromise = flowPromise.then(async () => {
                const handler = eventHandlers[event.type];
                if (!handler || error) return;

                try {
                    state = await handler(state, event);
                } catch (err) {
                    error = err;
                }
            }));

        readModelsStateRepository[name] = {
            getReadable: async () => state,
            getError: async () => error
        };

        return {
            stateProvider: readModelsStateRepository[name],
            eventWorker
        };
    },
    async get(stateName) {
        return readModelsStateRepository[name] || null;
    },
    async reset(stateName) {
        readModelsStateRepository[name] = null;
    }
});

const getState = async (storageProvider, eventStore, readModel, aggregateIds) => {
    const readModelName = readModel.name.toLowerCase();
    const isAggregateBased = Array.isArray(aggregateIds) && aggregateIds.length > 0;

    const stateName = isAggregateBased
        ? `${readModelName}\u200D${aggregateIds.sort().join('\u200D')}`
        : readModelName;

    let currentState = await storageProvider.get(stateName);
    if (!currentState) {
        const { stateProvider, eventWorker } = await storageProvider.init({ stateName, readModel });
        currentState = stateProvider;

        if (isAggregateBased) {
            await eventStore.subscribeByAggregateId(aggregateIds, eventWorker);
        } else {
            await eventStore.subscribeByEventType(
                Object.keys(readModel.eventHandlers),
                eventWorker
            );
        }
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
        (map, model) => normalizedModelMap.set(model.name.toLowerCase(), model),
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
