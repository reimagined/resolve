const importClientEntry = () => `
    import '$resolve.guardOnlyServer'

    export { default as entryPointMarker } from '@resolve-js/runtime'

    const handler = async (...args) => {
      try {
        if(!global.initPromise) {
          const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

          global.serverAssemblies = interopRequireDefault(
            require('$resolve.serverAssemblies')
          ).default
          global.cloudEntry = interopRequireDefault(
            require('@resolve-js/runtime/lib/cloud')
          ).default

          global.initPromise = cloudEntry(serverAssemblies)
        }
        const worker = await initPromise
        return await worker(...args)
      } catch(error) {
        console.error('Lambda fatal error: ', error)
        throw error
      }
    }

    export default handler
  `

export default importClientEntry
