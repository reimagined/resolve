const npm = require('npm')

const npmInstall = name =>
  new Promise((resolve, reject) => {
    npm.load(
      {
        loaded: false,
        save: false
      },
      loadErr => {
        if (loadErr) return reject(loadErr)
        npm.commands.install([name], (installErr, data) => {
          installErr ? reject(installErr) : resolve(data)
        })
      }
    )
  })

void (async () => {
  try {
    await npmInstall('zeromq')
  } catch (error) {
    try {
      await npmInstall('zeromq-ng')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Zeromq is not installed')
    }
  }
})()
