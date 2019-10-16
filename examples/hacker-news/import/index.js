import ProgressBar from 'progress'
import { EOL } from 'os'

import { start } from './importer'

const runImport = importConfig => {
  if (process.env.hasOwnProperty(String(importConfig.port))) {
    process.env.PORT = +String(process.env.PORT)
  } else if (
    process.env.PORT != null &&
    process.env.PORT.defaultValue != null
  ) {
    process.env.PORT = +process.env.PORT.defaultValue
  } else {
    process.env.PORT = 3000
  }

  Object.assign(process.env, {
    RESOLVE_SERVER_OPEN_BROWSER: 'false',
    ROOT_PATH: importConfig.rootPath
  })

  let bar
  // eslint-disable-next-line no-console
  console.log('Import has been started. Press Control+C to stop import')

  start(
    total => {
      bar = new ProgressBar(
        'Data importing from news.ycombinator.com [:bar] :current/:total',
        {
          width: 20,
          total
        }
      )
    },
    () => {
      bar.tick()
      if (bar.complete) {
        // eslint-disable-next-line no-console
        console.log(EOL)
        process.exit()
      }
    }
  )

  process.stdin.resume()
  process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log(EOL)
    process.exit()
  })
}

export default runImport
