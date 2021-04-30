const onCommandExecuted = async (resolve, event) => {
  await resolve.notifyEventSubscribers()
  await resolve.sendReactiveEvent(event)
}

const createOnCommandExecuted = (resolve) => {
  return onCommandExecuted.bind(null, resolve)
}

export default createOnCommandExecuted
