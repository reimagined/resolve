import ProgressBar from 'progress'
import { EOL } from 'os'

import { start } from './importer'
import path from 'path'

const runImport = (importConfig: any) => {
  const port = importConfig.hasOwnProperty('port')
    ? String(importConfig.port.defaultValue)
    : process.env.PORT || '3000'

  const appUrl = `http://localhost:${path.join(port, importConfig.rootPath)}`

  Object.assign(process.env, {
    RESOLVE_SERVER_OPEN_BROWSER: 'false',
    RESOLVE_APP_URL: appUrl,
  })

  let bar: ProgressBar
  // eslint-disable-next-line no-console
  console.log('Import has been started. Press Control+C to stop import')

  start(
    (total: number) => {
      bar = new ProgressBar(
        'Data importing from news.ycombinator.com [:bar] :current/:total',
        {
          width: 20,
          total,
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
