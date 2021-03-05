import chalk from 'chalk'

import { statsConfig } from './constants'

const showBuildInfo = (err, stats) => {
  if (!stats) {
    return
  }

  if (err) {
    // eslint-disable-next-line no-console
    console.error(err.stack || err)
    if (err.details) {
      // eslint-disable-next-line no-console
      console.error(err.details)
    }
    return
  }

  // eslint-disable-next-line no-console
  console.log(
    '[',
    chalk.green(stats.compilation.name),
    ']',
    stats.toString(statsConfig)
  )
}

export default showBuildInfo
