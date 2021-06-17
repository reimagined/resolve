const onCommandExecuted = async (resolve, event, command, eventWithCursor) => {
  await resolve.notifyEventSubscribers(eventWithCursor)
  await resolve.sendReactiveEvent(event)
  void command
}

const createOnCommandExecuted = (resolve) => {
  return onCommandExecuted.bind(null, resolve)
}

export default createOnCommandExecuted
