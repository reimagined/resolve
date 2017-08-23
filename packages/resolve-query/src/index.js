import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

function getExecutor({ eventStore, readModel }) {
    const eventTypes = Object.keys(readModel.eventHandlers);
    let state = readModel.initialState || {};
    let error = null;
    let result = null;

    const executableSchema =
        readModel.gqlSchema &&
        makeExecutableSchema({
            resolvers: readModel.gqlResolvers ? { Query: readModel.gqlResolvers } : {},
            typeDefs: readModel.gqlSchema
        });

    return async (gqlQuery, gqlVariables) => {
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
    const executors = readModels.reduce((result, readModel) => {
        result[readModel.name.toLowerCase()] = getExecutor({
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
