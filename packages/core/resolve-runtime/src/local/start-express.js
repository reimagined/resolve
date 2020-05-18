import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import bootstrap from './bootstrap'

const host = '0.0.0.0'
const startExpress = async resolve => {
  const {
    port,
    server,
    assemblies: {
      eventBrokerConfig: { upstream }
    }
  } = resolve

  const currentResolve = Object.create(resolve)
  try {
    await initResolve(currentResolve)
    await bootstrap(currentResolve)

    let readyListeners = 0
    while (upstream && readyListeners < resolve.eventListeners.size) {
      readyListeners = await Promise.all(
        Array.from(currentResolve.eventListeners.keys()).map(
          currentResolve.publisher.status
        )
      ).then(statuses =>
        statuses.reduce(
          ({ successEvent, failedEvent, errors }, acc) =>
            successEvent != null ||
            failedEvent != null ||
            (Array.isArray(errors) && errors.length > 0)
              ? acc + 1
              : acc,
          0
        )
      )

      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } finally {
    await disposeResolve(currentResolve)
  }

  await new Promise((resolve, reject) =>
    server.listen(port, host, async error => {
      if (error) {
        return reject(error)
      }

      // eslint-disable-next-line no-console
      console.log(`Application listening on port ${port}!`)
      return resolve()
    })
  )

  server.on('error', err => {
    throw err
  })
}

export default startExpress
