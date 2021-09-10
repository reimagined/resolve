import chalk from 'chalk'
import url from 'url'
import address from 'address'
import { getRootBasedUrl } from '@resolve-js/core'

const prepareUrls = (protocol, host, port, rootPath) => {
  const formatUrl = (hostname) =>
    url.format({
      protocol,
      hostname,
      port,
      pathname: getRootBasedUrl(rootPath, '/'),
    })
  const prettyPrintUrl = (hostname) =>
    url.format({
      protocol,
      hostname,
      port: chalk.bold(port),
      pathname: getRootBasedUrl(rootPath, '/'),
    })

  const isUnspecifiedHost = host === '0.0.0.0' || host === '::'
  let prettyHost, lanUrlForConfig, lanUrlForTerminal
  if (isUnspecifiedHost) {
    prettyHost = 'localhost'
    try {
      // This can only return an IP version 4 address
      lanUrlForConfig = address.ip()
      if (lanUrlForConfig) {
        // Check if the address is a private ip
        // https://en.wikipedia.org/wiki/Private_network#Private_IP version 4_address_spaces
        if (
          /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
            lanUrlForConfig
          )
        ) {
          // Address is private, format it for later use
          lanUrlForTerminal = prettyPrintUrl(lanUrlForConfig)
        } else {
          // Address is not private, so we will discard it
          lanUrlForConfig = undefined
        }
      }
    } catch (_e) {
      // ignored
    }
  } else {
    prettyHost = host
  }
  const localUrlForTerminal = prettyPrintUrl(prettyHost)
  const localUrlForBrowser = formatUrl(prettyHost)
  return {
    lanUrlForConfig,
    lanUrlForTerminal,
    localUrlForTerminal,
    localUrlForBrowser,
  }
}

export default prepareUrls
