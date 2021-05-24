import chalk from 'chalk'

import { statsConfig } from './constants'

const showBuildInfo = (err, stats) => {
  if (stats == null) {
    return
  }

  if (err != null) {
    // eslint-disable-next-line no-console
    console.error(err.stack != null ? err.stack : err)
    if (err.details != null) {
      // eslint-disable-next-line no-console
      console.error(err.details)
    }
    return
  }

  if (stats.hasErrors() && err == null) {
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
