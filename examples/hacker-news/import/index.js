import ProgressBar from 'progress'
import { EOL } from 'os'

import { start } from './importer'

const runImport = () => {
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
