import chalk from 'chalk'
import opn from 'opn'
import useYarn from './use_yarn'
import prepareUrls from './prepare_urls'
import resolveFile from './resolve_file'

const openBrowser = async (port, rootPath) => {
  let applicationName = 'application'
  try {
    applicationName = require(resolveFile('package.json')).name
  } catch (e) {}

  const urls = prepareUrls('http', '0.0.0.0', port, rootPath)

  const url = urls.localUrlForBrowser

  try {
    await opn(url, { app: process.env.BROWSER })
  } catch (err) {}

  /* eslint-disable no-console */
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
