import chalk from 'chalk'

import { statsConfig } from './constants'

const showBuildInfo = (err, stats) => {
  // TODO
  if (!stats) {
    return
  }
  // eslint-disable-next-line
  console.log(
    '[',
    chalk.green(stats.compilation.name),
    ']',
    stats.toString(statsConfig)
  )
  if (err) {
    // eslint-disable-next-line
    console.error(err)
  }
}

export default showBuildInfo
