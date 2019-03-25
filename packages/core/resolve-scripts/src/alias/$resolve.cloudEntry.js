export default () => ({
  code: `
    const handler = async (...args) => {
      try {
        if(!global.initPromise) {
          require('$resolve.installLogger')
          const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

          global.serverAssemblies = interopRequireDefault(
            require('$resolve.serverAssemblies')
          ).default
          global.cloudEntry = interopRequireDefault(
            require('resolve-runtime/lib/cloud_entry')
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
})
