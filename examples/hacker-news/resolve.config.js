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
  redux: {
    store: 'client/store/index.js',
    reducers: 'client/reducers/index.js',
    middlewares: 'client/middlewares/index.js'
  },
  aggregates: [
    {
      name: 'story',
      commands: 'common/aggregates/story.commands.js',
      projection: 'common/aggregates/story.projection.js'
    },
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  viewModels: [
    {
      name: 'storyDetails',
      projection: 'common/view-models/story_details.projection.js',
      serializeState: 'common/view-models/story_details.serialize_state.js',
      deserializeState: 'common/view-models/story_details.deserialize_state.js',
      snapshotAdapter: {
        module: 'common/view-models/snapshot_adapter.module.js',
        options: {
          pathToFile: 'snapshot.db',
          bucketSize: 1
        }
      }
    }
  ],
  readModels: [
    {
      name: 'default',
      projection: 'common/read-models/default.projection.js',
      resolvers: 'common/read-models/default.resolvers.js'
    }
  ],
  auth: {
    strategies: 'auth/localStrategy.js'
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
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
        mode: 'test'
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
