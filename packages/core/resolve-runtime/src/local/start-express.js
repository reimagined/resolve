import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import bootstrap from '../common/bootstrap'

const host = '0.0.0.0'
const startExpress = async resolve => {
  const { port, server } = resolve

  const currentResolve = Object.create(resolve)
  try {
    await initResolve(currentResolve)
    await bootstrap(currentResolve)
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
