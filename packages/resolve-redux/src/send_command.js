import { checkRequiredFields, getRootableUrl } from './util'

export default async function sendCommand(store, action) {
  const { command, aggregateId, aggregateName, payload } = action

  if (
    !(
      command &&
      checkRequiredFields(
        { aggregateId, aggregateName },
        'Send command error:',
        JSON.stringify(action)
      ) &&
      !(command.ok || command.error)
    )
  ) {
    return
  }

  const normalizedCommand = {
    type: command.type,
    aggregateId,
    aggregateName,
    payload
  }

  try {
    const response = await fetch(getRootableUrl('/api/commands'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(normalizedCommand)
    })

    if (response.ok) {
      store.dispatch({
        ...action,
        command: {
          ...action.command,
          ok: true
        }
      })

      return
    }

    const text = await response.text()
    // eslint-disable-next-line no-console
    console.error('Send command error:', text)
    throw new Error(text)
  } catch (error) {
    store.dispatch({
      ...action,
      command: {
        ...action.command,
        error
      }
    })
  }
}
