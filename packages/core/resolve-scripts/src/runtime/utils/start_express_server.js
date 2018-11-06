import chalk from 'chalk'

import openBrowser from './open_browser'
import println from './println'
import prepareUrls from './prepare_urls'

const useYarn =
  (process.env.npm_execpath && process.env.npm_execpath.includes('yarn')) ||
  (process.env.npm_config_user_agent &&
    process.env.npm_config_user_agent.includes('yarn'))

const isOpenBrowser = process.env.RESOLVE_SERVER_OPEN_BROWSER === 'true'

const host = '0.0.0.0'
const protocol = 'http'

const serverFirstStart = process.env.RESOLVE_SERVER_FIRST_START === 'true'

const startServer = ({ port, rootPath, applicationName, server }) => {
  const urls = prepareUrls(protocol, host, port, rootPath)

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

    if (isOpenBrowser && serverFirstStart) {
      openBrowser(urls.localUrlForBrowser)
    }
  })
  server.on('error', err => {
    throw err
  })
}

export default startServer
