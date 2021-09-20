const importClientEntry = () => `
    import '$resolve.guardOnlyServer'
    export { entryPointMarker } from '@resolve-js/runtime-base'

    const handler = async (...args) => {
      try {
        if(!global.initPromise) {
          const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

          global.serverAssemblies = interopRequireDefault(
            require('$resolve.serverAssemblies')
          ).default
          global.cloudEntry = interopRequireDefault(
            require('@resolve-js/runtime-aws-serverless')
          ).entry

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
