import chalk from 'chalk'

import openBrowser from './utils/open_browser'
import println from './utils/println'
import prepareUrls from './utils/prepare_urls'

const port = $resolve.port
const host = $resolve.host
const protocol = $resolve.protocol
const applicationName = $resolve.applicationName
const useYarn = $resolve.useYarn
const isOpenBrowser =
  $resolve.openBrowser && process.env.RESOLVE_SERVER_FIRST_START === 'true'

const urls = prepareUrls(protocol, host, port)

const startServer = server => {
  server.listen(port, host, () => {
    println()
    println(`You can now view ${chalk.bold(applicationName)} in the browser.`)
    println()

    if (urls.lanUrlForTerminal) {
      println(
        `  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}`
      )
      println(`  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`)
    } else {
      println(`  ${urls.localUrlForTerminal}`)
    }

    if (process.env.NODE_ENV !== 'production') {
      println()
      println('Note that the development build is not optimized.')
      println('To create a production build, use:')
      println(`  ${chalk.cyan(`${useYarn ? 'yarn build' : 'npm run build'}`)}.`)
      println(`  ${chalk.cyan(`${useYarn ? 'yarn start' : 'npm start'}`)}.`)
      println()
    }

    if (isOpenBrowser) {
      openBrowser(urls.localUrlForBrowser)
    }
  })
  server.on('error', err => {
    throw err
  })
}

export default startServer
