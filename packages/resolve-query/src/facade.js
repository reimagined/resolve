import 'regenerator-runtime/runtime'
import { makeExecutableSchema } from 'graphql-tools'
import { parse, execute } from 'graphql'

const createFacade = ({ model, gqlSchema, gqlResolvers, customResolvers }) => {
  const executors = Object.create(null, {
    executeQueryRaw: {
      value: async (...args) => await model(...args),
      enumerable: true
    }
  })

  if (gqlSchema || gqlResolvers) {
    const executableSchema = makeExecutableSchema({
      typeDefs: gqlSchema,
      resolvers: { Query: gqlResolvers }
    })

    Object.defineProperty(executors, 'executeQueryGraphql', {
      value: async (gqlQuery, gqlVariables, jwtToken) => {
        const parsedGqlQuery = parse(gqlQuery)

        const gqlResponse = await execute(
          executableSchema,
          parsedGqlQuery,
          await model(),
          { jwtToken },
          gqlVariables
        )

        if (gqlResponse.errors) throw gqlResponse.errors
        return gqlResponse.data
      },
      enumerable: true
    })
  }

  Object.defineProperty(executors, 'dispose', {
    value: model.dispose.bind(model),
    enumerable: false
  })

  Object.defineProperty(executors, 'executeQueryCustom', {
    value: async (name, ...args) => {
      if (!customResolvers || !customResolvers[name]) {
        throw new Error(`The '${name}' custom resolver is not specified`)
      }

      return await customResolvers[name](model, ...args)
    },
    enumerable: true
  })

  return executors
}

export default createFacade
