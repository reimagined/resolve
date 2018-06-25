import readModelQueryExecutors from './read_model_query_executors'
import println from './utils/println'
import stringify from 'json-stable-stringify'
import pubsubManager from './pubsub_manager'

const message = require('../../../configs/message.json')

export const READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE = 300000
export const subscriptionProcesses = new Map()

export const readModelSubscribeHandler = (req, res) => {
  const { queryId, modelName, resolverName, resolverArgs } = req.params
  
  const subscriptionKey = `${queryId}:${modelName}:${resolverName}:${stringify(resolverArgs)}`
  if (subscriptionProcesses.get(subscriptionKey)) {
    res
      .status(500)
      .send(
        `Socket subscription ${modelName}:${subscriptionKey} already connected`
      )
    return
  }

  const subscriptionPromise = (async () => {
    await Promise.resolve()
    
    let queryDiffVersion = 1
    
    try {
      const { result, forceStop } = await readModelQueryExecutors[
        modelName
      ].makeSubscriber(
        diff => {
          try {
            pubsubManager.dispatch({
              topicName: 'READ_MODEL_DIFFS',
              topicId: queryId,
              message: {
                type: '@@resolve/READMODEL_SUBSCRIPTION_DIFF',
                queryId,
                queryDiffVersion: queryDiffVersion++,
                diff
              }
            })
          } catch (sockErr) {
            subscriptionProcesses.delete(subscriptionKey)
            forceStop()
          }
        },
        resolverName,
        {
          ...resolverArgs,
          jwtToken: req.jwtToken
        }
      )

      res.status(200).send({
        timeToLive: READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE,
        queryId,
        result
      })

      setTimeout(() => {
        subscriptionProcesses.delete(subscriptionKey)
        forceStop()
      }, READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE)

      return forceStop
    } catch (err) {
      res.status(500).end(`${message.readModelFail}${err.message}`)

      subscriptionProcesses.delete(subscriptionKey)

      println.error(err)
    }
  })()

  subscriptionProcesses.set(subscriptionKey, subscriptionPromise)
  
  void (async () => {
    const lastError = await readModelQueryExecutors[modelName].getLastError()
    if (lastError != null) {
      println.error(lastError)
    }
  })()
}

export const readModelUnsubscribeHandler = (req, res) => {
  try {
    const { queryId, modelName, resolverName, resolverArgs } = req.query
    const subscriptionKey = `${queryId}:${modelName}:${resolverName}:${stringify(resolverArgs)}`

    const forceStopPromise = subscriptionProcesses.get(subscriptionKey)
    if (forceStopPromise) {
      forceStopPromise.then(stop => stop())
    }

    subscriptionProcesses.delete(subscriptionKey)

    res.status(200).send('OK')
  } catch (err) {
    res.status(500).end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

const readModelReactiveHandler = (req, res) => {
  switch (req.method) {
    case 'POST':
      return readModelSubscribeHandler(req, res)
    case 'DELETE':
      return readModelUnsubscribeHandler(req, res)
    default:
      return res.status(405).end()
  }
}

export default readModelReactiveHandler
