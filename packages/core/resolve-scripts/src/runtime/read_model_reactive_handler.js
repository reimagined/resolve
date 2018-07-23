import readModelQueryExecutors from './read_model_query_executors'
import println from './utils/println'
import pubsubManager from './pubsub_manager'
import {
  queryIdArg,
  diffTopicName,
  diffMessageType,
  readModelSubscriptionTimeToLive
} from './constants'

const message = require('../../configs/message.json')

export const subscriptionProcesses = new Map()

export const readModelSubscribeHandler = (req, res) => {
  const { modelName: readModelName, modelOptions: resolverName } = req.params
  const { [queryIdArg]: queryId, ...resolverArgs } = req.arguments

  if (subscriptionProcesses.get(queryId)) {
    res
      .status(500)
      .send(`Socket subscription ${readModelName}:${queryId} already connected`)
    return
  }

  const subscriptionPromise = (async () => {
    await Promise.resolve()

    let queryDiffVersion = 1

    try {
      const { result, forceStop } = await readModelQueryExecutors[
        readModelName
      ].makeSubscriber(
        diff => {
          try {
            pubsubManager.dispatch({
              topicName: diffTopicName,
              topicId: queryId,
              event: {
                type: diffMessageType,
                queryId,
                diffVersion: queryDiffVersion++,
                diff
              }
            })
          } catch (sockErr) {
            subscriptionProcesses.delete(queryId)
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
        timeToLive: readModelSubscriptionTimeToLive,
        queryId,
        result
      })

      setTimeout(() => {
        subscriptionProcesses.delete(queryId)
        forceStop()
      }, readModelSubscriptionTimeToLive)

      return forceStop
    } catch (err) {
      res.status(500).end(`${message.readModelFail}${err.message}`)

      subscriptionProcesses.delete(queryId)

      println.error(err)
    }
  })()

  subscriptionProcesses.set(queryId, subscriptionPromise)

  void (async () => {
    const lastError = await readModelQueryExecutors[
      readModelName
    ].getLastError()
    if (lastError != null) {
      println.error(lastError)
    }
  })()
}

export const readModelUnsubscribeHandler = (req, res) => {
  try {
    const { [queryIdArg]: queryId } = req.arguments

    const forceStopPromise = subscriptionProcesses.get(queryId)
    if (forceStopPromise) {
      forceStopPromise.then(stop => stop())
    }

    subscriptionProcesses.delete(queryId)

    res.status(200).send('OK')
  } catch (err) {
    res.status(500).end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

export default {
  readModelSubscribeHandler,
  readModelUnsubscribeHandler
}
