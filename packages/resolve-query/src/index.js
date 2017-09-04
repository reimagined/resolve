import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';

const getState = async ({ statesRepository, eventStore, readModel, aggregateIds }) => {
    const readModelName = readModel.name.toLowerCase();
    const isAggregateBased = Array.isArray(aggregateIds) && aggregateIds.length > 0;

    const stateName = isAggregateBased
        ? `${readModelName}\u200D${aggregateIds.sort().join('\u200D')}`
        : readModelName;

    const { eventHandlers, initialState } = readModel;

    if (!statesRepository[stateName]) {
        const eventTypes = Object.keys(eventHandlers);
        let state = initialState || {};
        let error = null;

        const result = !isAggregateBased
            ? eventStore.subscribeByEventType(eventTypes, (event) => {
                const handler = eventHandlers[event.type];
                if (!handler) return;

                try {
                    state = handler(state, event);
                } catch (err) {
                    error = err;
                }
            })
            : eventStore.subscribeByAggregateId(aggregateIds, (event) => {
                const handler = eventHandlers[event.type];
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
};

function extractAggregateIdsFromGqlQuery(parsedGqlQuery, gqlVariables) {
    const findAllAggregateIds = (queryObject, store = []) => {
        if (!queryObject || typeof queryObject !== 'object') return store;

        if (queryObject.kind === 'Field' && Array.isArray(queryObject.arguments)) {
            queryObject.arguments
                .filter(arg => arg.name && arg.name.value === 'aggregateId' && arg.value)
                .map(
                    arg =>
                        arg.value.kind === 'Variable' && arg.value.name && arg.value.name.value
                            ? gqlVariables[arg.value.name.value]
                            : arg.value.value
                )
                .forEach(value => store.push(value));
        }

        if (Object.getPrototypeOf(queryObject) === Object.prototype) {
            Object.keys(queryObject).forEach(key => findAllAggregateIds(queryObject[key], store));
        } else if (Array.isArray(queryObject)) {
            queryObject.forEach(part => findAllAggregateIds(part, store));
        }

        return store;
    };

    return findAllAggregateIds(parsedGqlQuery);
}

function getExecutor({ statesRepository, eventStore, readModel }) {
    const { gqlSchema, gqlResolvers, name } = readModel;
    const executableSchema =
        gqlSchema &&
        makeExecutableSchema({
            resolvers: gqlResolvers ? { Query: gqlResolvers } : {},
            typeDefs: gqlSchema
        });

    return async (gqlQuery, gqlVariables, jwtPayload) => {
        if (!gqlQuery) {
            return await getState({ statesRepository, eventStore, readModel });
        }

        if (!executableSchema) {
            throw new Error(`GraphQL schema for '${name}' read model is not found`);
        }

        const parsedGqlQuery = parse(gqlQuery);
        const aggregateIds = extractAggregateIdsFromGqlQuery(parsedGqlQuery, gqlVariables);
        const state = await getState({ statesRepository, eventStore, readModel, aggregateIds });

        const gqlResponse = await execute(
            executableSchema,
            parsedGqlQuery,
            state,
            { jwtPayload },
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

    return async (readModelName, gqlQuery, gqlVariables, jwtPayload) => {
        const executor = executors[readModelName.toLowerCase()];

        if (executor === undefined) {
            throw new Error(`The '${readModelName}' read model is not found`);
        }

        return executor(gqlQuery, gqlVariables, jwtPayload);
    };
};
