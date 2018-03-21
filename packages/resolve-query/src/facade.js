import 'regenerator-runtime/runtime'
import { diff } from 'diff-json'

const [diffWrapperPrev, diffWrapperNext] = [{ wrap: null }, { wrap: null }]

const createFacade = ({ model, resolvers }) => {
  const executeQuery = async (name, resolverOptions = {}, readOptions = {}) => {
    if (!resolvers || typeof resolvers[name] !== 'function') {
      throw new Error(`The '${name}' resolver is not specified or not function`)
    }

    return await resolvers[name](await model.read(readOptions), resolverOptions)
  }

  const makeReactiveReader = async (
    publisher,
    name,
    resolverOptions = {},
    readOptions = {}
  ) => {
    if (typeof publisher !== 'function') {
      throw new Error(
        'Publisher should be callback function (diff: Object) => void'
      )
    }

    let result = await executeQuery(name, resolverOptions, readOptions)
    let flowPromise = Promise.resolve()

    const eventHandler = async () => {
      if (!flowPromise) return

      const actualResult = await executeQuery(
        name,
        resolverOptions,
        readOptions
      )
      void ([diffWrapperPrev.wrap, diffWrapperNext.wrap] = [
        result,
        actualResult
      ])

      const difference = diff(diffWrapperPrev, diffWrapperNext)
      result = actualResult

      await publisher(difference)
    }

    const eventListener = event =>
      (flowPromise = flowPromise.then(eventHandler.bind(null, event)))
    model.addEventListener(eventListener)

    const forceStop = () => {
      if (!flowPromise) return
      model.removeEventListener(eventListener)
      flowPromise = null
    }

    return { result, forceStop }
  }

  const executors = Object.create(null, {
    executeQuery: {
      value: executeQuery,
      enumerable: true
    },

    makeReactiveReader: {
      value: makeReactiveReader,
      enumerable: true
    },

    executeQueryRaw: {
      value: model.read.bind(model),
      enumerable: false
    },

    dispose: {
      value: model.dispose.bind(model),
      enumerable: false
    }
  })

  return Object.freeze(executors)
}

export default createFacade
