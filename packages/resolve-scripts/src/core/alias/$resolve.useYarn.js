import { message } from '../constants'

export default ({ deployOptions, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.useYarn`
    )
  }
  
  const exports = []
  
  exports.push(
    `const useYarn = ${JSON.stringify(deployOptions.useYarn, null, 2)}`,
    ``,
    `export default useYarn`
  )
  
  return {
    code: exports.join('\r\n')
  }
}
