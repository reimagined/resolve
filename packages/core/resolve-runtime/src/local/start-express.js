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

  if (upstream) {
    const currentResolve = Object.create(resolve)
    try {
      await initResolve(currentResolve)
      await bootstrap(currentResolve)
      readyLoop: while (true) {
        for (const { name: readModelName } of resolve.readModels) {
          const status = await resolve.eventBroker.status(readModelName)
          if (status.lastEvent == null && status.lastError == null) {
            continue readyLoop
          }
        }
        // eslint-disable-next-line no-extra-label
        break readyLoop
      }
    } finally {
      await disposeResolve(currentResolve)
    }
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
