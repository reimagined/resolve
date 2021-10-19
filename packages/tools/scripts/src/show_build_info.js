import chalk from 'chalk'

import { statsConfig, OPTIONAL_ASSET_ERROR } from './constants'

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
    const statsStr = stats.toString(statsConfig)
    if (statsStr.indexOf(OPTIONAL_ASSET_ERROR) < 0) {
      // eslint-disable-next-line no-console
      console.log(
        '[',
        chalk.yellow(stats.compilation.name),
        ']',
        chalk.yellow(statsStr)
      )
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
