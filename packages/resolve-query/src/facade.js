import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const createFacade = ({ model, gqlSchema, gqlResolvers, customResolvers }) => {
    const executors = Object.create(null, {
        raw: { value: async (...args) => await model(...args) }
    });

    if (gqlSchema && gqlResolvers) {
        const executableSchema = makeExecutableSchema({
            typeDefs: model.gqlSchema,
            resolvers: { Query: model.gqlResolvers }
        });

        executors.graphql = async (gqlQuery, gqlVariables, getJwt) => {
            const parsedGqlQuery = parse(gqlQuery);

            const gqlResponse = await execute(
                executableSchema,
                parsedGqlQuery,
                await model(),
                { getJwt },
                gqlVariables
            );

            if (gqlResponse.errors) throw gqlResponse.errors;
            return gqlResponse.data;
        };
    }

    Object.defineProperty(executors, 'dispose', {
        value: model.dispose.bind(model)
    });

    if (typeof customResolvers === 'object' && Object.keys(customResolvers) > 0) {
        Object.keys(customResolvers).forEach((name) => {
            executors[name] = customResolvers[name].bind(null, model);
        });
    }

    return executors;
};

export default createFacade;
