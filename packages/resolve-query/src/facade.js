import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const createFacade = ({ readModel, gqlSchema, gqlResolvers, customResolvers }) => {
    const executors = Object.create(null, {
        raw: { value: async (...args) => await readModel(...args) }
    });

    if (gqlSchema && gqlResolvers) {
        const executableSchema = makeExecutableSchema({
            typeDefs: readModel.gqlSchema,
            resolvers: { Query: readModel.gqlResolvers }
        });

        executors.graphql = async (gqlQuery, gqlVariables, getJwt) => {
            const parsedGqlQuery = parse(gqlQuery);

            const gqlResponse = await execute(
                executableSchema,
                parsedGqlQuery,
                await readModel(),
                { getJwt },
                gqlVariables
            );

            if (gqlResponse.errors) throw gqlResponse.errors;
            return gqlResponse.data;
        };
    }

    Object.defineProperty(executors, 'dispose', {
        value: readModel.dispose.bind(readModel)
    });

    if (typeof customResolvers === 'object' && Object.keys(customResolvers) > 0) {
        Object.keys(customResolvers).forEach((name) => {
            executors[name] = customResolvers[name].bind(null, readModel);
        });
    }

    return executors;
};

export default createFacade;
