import { createClient } from 'resolve-local-rpc'

const connectPublisher = async config => {
  const eventListenerHook = async args => {
    const [eventListener] = args
    if (!config.eventListeners.has(eventListener)) {
      throw new Error(`Event listener ${eventListener} does not exist`)
    }
    return args
  }

  const client = await createClient({
    address: config.address,
    preExecHooks: {
      status: eventListenerHook,
      resume: eventListenerHook,
      pause: eventListenerHook
    }
  })

  return client
}

export default connectPublisher
