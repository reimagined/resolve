import { createClient } from '@resolve-js/local-rpc'

const connectConsumer = async (config) => {
  return await createClient({
    address: config.address,
  })
}

export default connectConsumer
