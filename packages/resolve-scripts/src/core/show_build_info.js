import chalk from 'chalk'

import statsConfig from '../../configs/stats.config.json'

const showBuildInfo = ({ name }, err, stats) => {
  if (!stats) {
    return
  }
  // eslint-disable-next-line
  console.log('[', chalk.green(name), ']', stats.toString(statsConfig))
  if (err) {
    // eslint-disable-next-line
    console.error(err)
  }
}

export default showBuildInfo
