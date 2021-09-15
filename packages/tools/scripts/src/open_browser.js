import chalk from 'chalk'
import fetch from 'isomorphic-fetch'
import open from 'open'
import path from 'path'

import useYarn from './use_yarn'
import prepareUrls from './prepare_urls'

const openBrowser = async (host = '0.0.0.0', port, rootPath) => {
  let applicationName = 'application'
  try {
    applicationName = require(path.join(process.cwd(), 'package.json')).name
  } catch (e) {}

  const urls = prepareUrls('http', host, port, rootPath)
  const url = urls.localUrlForBrowser

  /* eslint-disable no-console */
  while (true) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await fetch(url)
      break
    } catch (error) {
      console.log(`Server is still loading - please wait...`)
    }
  }

  Promise.resolve()
    .then(() => open(url, { app: process.env.BROWSER }))
    .catch(() => {})

  console.log()
  console.log(`You can now view ${chalk.bold(applicationName)} in the browser.`)
  console.log()

  if (urls.lanUrlForTerminal) {
    console.log(
      `  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}`
    )
    console.log(
      `  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`
    )
  } else {
    console.log(`  ${urls.localUrlForTerminal}`)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log()
    console.log('Note that the development build is not optimized.')
    console.log('To create a production build, use:')
    console.log(
      `  ${chalk.cyan(`${useYarn() ? 'yarn build' : 'npm run build'}`)}.`
    )
    console.log(`  ${chalk.cyan(`${useYarn() ? 'yarn start' : 'npm start'}`)}.`)
    console.log()
  }
  /* eslint-enable no-console */
}

export default openBrowser
