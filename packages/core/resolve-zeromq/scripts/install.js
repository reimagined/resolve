const npm = require('npm')
const { renameSync } = require('fs')
const path = require('path')

const npmInstall = name =>
  new Promise((resolve, reject) => {
    npm.load(
      {
        loaded: false,
        save: false,
        prefix: 'optional'
      },
      loadErr => {
        if (loadErr) return reject(loadErr)
        npm.commands.install([name], (installErr, data) => {
          installErr ? reject(installErr) : resolve(data)
        })
      }
    )
  }).then(() => {
    renameSync(
      path.join(__dirname, '..', 'optional', 'node_modules'),
      path.join(__dirname, '..', 'optional', 'dependencies')
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
