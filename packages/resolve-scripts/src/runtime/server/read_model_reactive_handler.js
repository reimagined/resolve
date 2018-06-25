import readModelQueryExecutors from './read_model_query_executors'
import println from './utils/println'
import pubsubManager from './pubsub_manager'

const message = require('../../../configs/message.json')

export const READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE = 300000
export const subscriptionProcesses = new Map()

export const readModelSubscribeHandler = (req, res) => {
  const { readModelName, resolverName, queryId, resolverArgs } = req.body

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
        timeToLive: READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE,
        queryId,
        result
      })

      setTimeout(() => {
        subscriptionProcesses.delete(queryId)
        forceStop()
      }, READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE)

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
    const { queryId } = req.body

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
