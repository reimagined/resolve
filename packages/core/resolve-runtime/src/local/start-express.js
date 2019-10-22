import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import bootstrap from '../common/bootstrap'

const host = '0.0.0.0'
const startExpress = async resolve => {
  const {
    port,
    server,
    assemblies: {
      eventBroker: { upstream }
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
          currentResolve.eventBroker.status
        )
      ).then(statuses =>
        statuses.reduce(
          ({ lastEvent, lastError }, acc) =>
            lastEvent != null || lastError != null ? acc + 1 : acc,
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
