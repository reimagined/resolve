const onCommandExecuted = async (resolve, event, command, cursor) => {
  await resolve.notifyEventSubscribers(event, cursor)
  await resolve.sendReactiveEvent(event)
  void command
}

const createOnCommandExecuted = (resolve) => {
  return onCommandExecuted.bind(null, resolve)
}

export default createOnCommandExecuted
