import 'regenerator-runtime/runtime';
import { makeExecutableSchema, buildSchemaFromTypeDefinitions } from 'graphql-tools';
import { parse, execute } from 'graphql';

function getExecutor({ eventStore, readModel }) {
    const eventTypes = Object.keys(readModel.eventHandlers);
    let state = readModel.initialState || {};
    let error = null;
    let result = null;

    let executableSchema = null;
    if (readModel.gqlSchema) {
        const schemaDeclaration = buildSchemaFromTypeDefinitions(readModel.gqlSchema);
        let queryResolvers;

        const queryType = schemaDeclaration.getQueryType();
        if (!queryType) {
            throw new Error(`GraphQL schema for '${readModel.name}' has no Query type`);
        }

        const queryFields = queryType.getFields();
        queryResolvers = Object.keys(queryFields).reduce((acc, val) => {
            acc[val] = (obj, args, state) => Object.keys(state[val]).map(key => state[val][key]);
            return acc;
        }, {});

        const customQueryResolvers = readModel.gqlResolvers || {};
        Object.assign(queryResolvers, customQueryResolvers);

        executableSchema = makeExecutableSchema({
            typeDefs: readModel.gqlSchema,
            resolvers: queryResolvers ? { Query: queryResolvers } : {}
        });
    }

    return async (gqlQuery) => {
        result =
            result ||
            eventStore.subscribeByEventType(eventTypes, (event) => {
                const handler = readModel.eventHandlers[event.type];
                if (!handler) return;

                try {
                    state = handler(state, event);
                } catch (err) {
                    error = err;
                }
            });

        await result;
        if (error) throw error;

        if (!gqlQuery) return state;

        if (!executableSchema) {
            throw new Error(`GraphQL schema for '${readModel.name}' read model is not found`);
        }

        const parsedGqlQuery = parse(gqlQuery);
        const gqlResponse = await execute(executableSchema, parsedGqlQuery, null, state);

        if (gqlResponse.errors) throw gqlResponse.errors;
        return gqlResponse.data;
    };
}

export default ({ eventStore, readModels }) => {
    const executors = readModels.reduce((result, readModel) => {
        result[readModel.name.toLowerCase()] = getExecutor({
            eventStore,
            readModel
        });
        return result;
    }, {});

    return async (readModelName, gqlQuery) => {
        const executor = executors[readModelName.toLowerCase()];

        if (executor === undefined) {
            throw new Error(`The '${readModelName}' read model is not found`);
        }

        return executor(gqlQuery);
    };
};
