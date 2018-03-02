import 'regenerator-runtime/runtime'
import { diff } from 'diff-json'
import { makeExecutableSchema } from 'graphql-tools'
import { parse, execute } from 'graphql'

const createFacade = ({ model, gqlSchema, gqlResolvers, customResolvers }) => {
  const executors = Object.create(null, {
    executeQueryRaw: {
      value: async (...args) => await model(...args),
      enumerable: true
    },

    executeQueryCustom: {
      value: async (name, ...args) => {
        if (!customResolvers || !customResolvers[name]) {
          throw new Error(`The '${name}' custom resolver is not specified`)
        }

        return await customResolvers[name](model, ...args)
      },
      enumerable: true
    },

    dispose: {
      value: model.dispose.bind(model),
      enumerable: false
    }
  })

  if (gqlSchema || gqlResolvers) {
    const executableSchema = makeExecutableSchema({
      typeDefs: gqlSchema,
      resolvers: { Query: gqlResolvers }
    })

    const execGraphql = async (gqlQuery, gqlVariables, jwtToken) => {
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
    }

    const makeReactiveReader = async (publisher, timeout, ...execGqlArgs) => {
      if (
        typeof publisher !== 'function' ||
        !Number.isInteger(timeout) ||
        timeout <= 0 ||
        timeout >= Math.pow(2, 31)
      ) {
        throw new Error('Publisher should be function, timeout should be integer in milliseconds')
      }

      let result = await execGraphql(...execGqlArgs)

      let flowPromise = Promise.resolve()
      const eventHandler = async () => {
        if (!flowPromise) return
        const actualResult = await execGraphql(...execGqlArgs)
        const difference = diff(result, actualResult)
        result = actualResult
        await publisher(difference)
      }

      const eventListener = event =>
        (flowPromise = flowPromise.then(eventHandler.bind(null, event)))
      model.setEventListener(eventListener)

      const forseStop = () => {
        if (!flowPromise) return
        model.removeEventListener(eventListener)
        flowPromise = null
      }

      return { result, forseStop }
    }

    Object.defineProperties(executors, {
      executeQueryGraphql: {
        value: execGraphql,
        enumerable: true
      },
      makeReactiveGraphqlReader: {
        value: makeReactiveReader,
        enumerable: true
      }
    })
  }

  return Object.freeze(executors)
}

export default createFacade
