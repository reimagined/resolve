import getSocketByClientId from './utils/get_socket_by_client_id'
import readModelQueryExecutors from './read_model_query_executors'
import message from './constants/message'
import println from './utils/println'

export const READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE = 300000
export const subscriptionProcesses = new Map()

export const readModelSubscribeHandler = (req, res) => {
  const serialId = Date.now()

  const { modelName, resolverName } = req.params

  const subscriptionKey = `${req.body.socketId}:${resolverName}`
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
    try {
      getSocketByClientId(req.socket, req.body.socketId)

      const { result, forceStop } = await readModelQueryExecutors[
        modelName
      ].makeSubscriber(
        diff => {
          try {
            const socketClient = getSocketByClientId(
              req.socket,
              req.body.socketId
            )
            socketClient.emit(
              'event',
              JSON.stringify({
                type: '@@resolve/READMODEL_SUBSCRIPTION_DIFF',
                readModelName: modelName,
                resolverName,
                serialId,
                diff
              })
            )
          } catch (sockErr) {
            subscriptionProcesses.delete(subscriptionKey)
            forceStop()
          }
        },
        resolverName,
        req.body.variables,
        req.jwtToken
      )

      res.status(200).send({
        timeToLive: READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE,
        serialId,
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
}

export const readModelUnsubscribeHandler = (req, res) => {
  try {
    const subscriptionKey = `${req.query.socketId}:${req.params.resolverName}`

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
