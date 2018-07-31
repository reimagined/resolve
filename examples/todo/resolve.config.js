import { execSync } from 'child_process'
import { getInstallations } from 'testcafe-browser-tools'

import {
  defaultResolveConfig,
  build,
  start,
  watch,
  startWaitReady
} from 'resolve-scripts'

const config = {
  ...defaultResolveConfig,
  port: 3000,
  routes: 'client/routes.js',
  aggregates: [
    {
      name: 'Todo',
      commands: 'common/aggregates/todo.commands.js'
    }
  ],
  viewModels: [
    {
      name: 'Todos',
      projection: 'common/view-models/todos.projection.js'
    }
  ]
}

async function main() {
  const launchMode = process.argv[2]

  switch (launchMode) {
    case 'dev': {
      await watch({
        ...config,
        mode: 'development'
      })
      break
    }

    case 'build': {
      await build({
        ...config,
        mode: 'production'
      })
      break
    }

    case 'start': {
      const stopServer = await start()
      process.on('exit', stopServer)
      break
    }

    case 'test:functional': {
      Object.assign(config, {
        storageAdapter: {
          module: 'resolve-storage-lite',
          options: {}
        },
        mode: 'development'
      })

      await build(config)

      const stopServer = await startWaitReady(config)
      process.on('exit', stopServer)

      const browser = !process.argv[3]
        ? Object.keys(await getInstallations())[0]
        : process.argv[3]
      const TIMEOUT = 20000

      execSync(
        `npx testcafe ${browser}` +
          ' test/functional' +
          ` --app-init-delay ${TIMEOUT}` +
          ` --selector-timeout ${TIMEOUT}` +
          ` --assertion-timeout ${TIMEOUT}` +
          ` --page-load-timeout ${TIMEOUT}` +
          (browser === 'remote' ? ' --qr-code' : ''),
        { stdio: 'inherit' }
      )

      await stopServer()

      break
    }

    default: {
      throw new Error('Unknown option')
      break
    }
  }
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
