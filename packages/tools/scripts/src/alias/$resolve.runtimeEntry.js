import { message } from '../constants'

const importEntry = async ({ isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.runtimeEntry`)
  }

  return `
    import '$resolve.guardOnlyServer'
    import { entry as makeEntry } from '@resolve-js/runtime-base'
    import serverAssemblies from '$resolve.serverAssemblies'

    const entry = makeEntry(serverAssemblies)

    export default entry 
  `
}
export default importEntry
