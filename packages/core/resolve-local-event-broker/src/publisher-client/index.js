import { createClient } from 'resolve-local-rpc';

const connectPublisher = async (config) => {
  const eventListenerHook = async (args) => {
    const [{ eventSubscriber }] = args;
    if (
      !config.eventListeners.has(eventSubscriber) &&
      eventSubscriber !== 'websocket'
    ) {
      throw new Error(`Event listener ${eventSubscriber} does not exist`);
    }
    return args;
  };

  const client = await createClient({
    address: config.address,
    preExecHooks: {
      status: eventListenerHook,
      resume: eventListenerHook,
      pause: eventListenerHook,
    },
  });

  return client;
};

export default connectPublisher;
