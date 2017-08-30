import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

async function getState({ statesRepository, eventStore, readModel, aggregateIds }) {
    const readModelName = readModel.name.toLowerCase();

    const stateName = Array.isArray(aggregateIds) && aggregateIds.length > 0
        ? `${readModelName}\u200D${aggregateIds.sort().join('\u200D')}`
        : readModelName;

    if (!statesRepository[stateName]) {
        const eventTypes = Object.keys(readModel.eventHandlers);
        let state = readModel.initialState || {};
        let error = null;

        const result = eventStore.subscribeByEventType(eventTypes, (event) => {
            const handler = readModel.eventHandlers[event.type];
            if (!handler) return;

            try {
                state = handler(state, event);
            } catch (err) {
                error = err;
            }
        });

        statesRepository[stateName] = async () => {
            await result;
            if (error) throw error;
            return state;
        };
    }

    return await statesRepository[stateName]();
}

function extractAggregateIdsFromGqlQuery(parsedGqlQuery) {
    console.log(parsedGqlQuery);
    return [];
}

function getExecutor({ statesRepository, eventStore, readModel }) {
    const executableSchema =
        readModel.gqlSchema &&
        makeExecutableSchema({
            resolvers: readModel.gqlResolvers ? { Query: readModel.gqlResolvers } : {},
            typeDefs: readModel.gqlSchema
        });

    return async (gqlQuery, gqlVariables) => {
        if (!gqlQuery) {
            return await getState({ statesRepository, eventStore, readModel });
        }

        if (!executableSchema) {
            throw new Error(`GraphQL schema for '${readModel.name}' read model is not found`);
        }

        const parsedGqlQuery = parse(gqlQuery);
        const aggregateIds = extractAggregateIdsFromGqlQuery(parsedGqlQuery);
        const state = await getState({ statesRepository, eventStore, readModel, aggregateIds });

        const gqlResponse = await execute(
            executableSchema,
            parsedGqlQuery,
            state,
            {},
            gqlVariables
        );

        if (gqlResponse.errors) throw gqlResponse.errors;
        return gqlResponse.data;
    };
}

export default ({ eventStore, readModels }) => {
    const statesRepository = {};

    const executors = readModels.reduce((result, readModel) => {
        result[readModel.name.toLowerCase()] = getExecutor({
            statesRepository,
            eventStore,
            readModel
        });
        return result;
    }, {});

    return async (readModelName, gqlQuery, gqlVariables) => {
        const executor = executors[readModelName.toLowerCase()];

        if (executor === undefined) {
            throw new Error(`The '${readModelName}' read model is not found`);
        }

        return executor(gqlQuery, gqlVariables);
    };
};
