import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const createFacade = ({ readModel, gqlSchema, gqlResolvers, customResolvers }) => {
    let executor = async (...args) => await readModel(...args);

    if (gqlSchema && gqlResolvers) {
        const executableSchema = makeExecutableSchema({
            typeDefs: readModel.gqlSchema,
            resolvers: { Query: readModel.gqlResolvers }
        });

        executor.graphql = async (gqlQuery, gqlVariables, getJwt) => {
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

    executor.dispose = readModel.dispose.bind(readModel);

    if (typeof customResolvers === 'object' && Object.keys(customResolvers) > 0) {
        Object.keys(customResolvers).forEach((name) => {
            executor[name] = customResolvers[name].bind(null, readModel);
        });
    }

    return executor;
};

export default createFacade;
