import { message } from '../constants'

export default ({ isClient }) => {
  if (!isClient) {
    throw new Error(
      `${message.clientAliasInServerCodeError}$resolve.hotModuleReplacement`
    )
  }

  const exports = [
    `import socketIOClient from 'socket.io-client'`,
    `import rootPath from '$resolve.rootPath'`,
    ``,
    `const origin = window.location.origin`,
    ``,
    `let HMR_ID = null`,
    ``,
    `const client = socketIOClient(origin, {`,
    `  path: (rootPath ? ('/' + rootPath) : '') + '/api/hmr'`,
    `})`,
    ``,
    `client.on('hotModuleReload', message => {`,
    `  if (HMR_ID && HMR_ID !== message) {`,
    `    window.location.reload()`,
    `  }`,
    `  HMR_ID = message`,
    `})`,
    ``,
    `client.on('error', () => {})`
  ]

  return {
    code: exports.join('\r\n')
  }
}
