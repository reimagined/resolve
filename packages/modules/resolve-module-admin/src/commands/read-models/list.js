import fetch from 'isomorphic-fetch'
import columnify from 'columnify'
import dateFormat from 'dateformat'

export const handler = async ({ url }) => {
  const response = await fetch(`${url}/event-broker/read-models-list`)
  const result = await response.json()
  if (result.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Read-models is not defined')
    return
  }
  const columns = []
  for (const { listenerId, status, lastEvent, lastError } of result) {
    columns.push({
      name: listenerId,
      status,
      'last event': lastEvent
        ? `${dateFormat(new Date(lastEvent.timestamp), 'm/d/yy HH:MM:ss')} ${
            lastEvent.type
          }`
        : 'N\\A',
      'last error': lastError ? `${lastError.message}` : 'N\\A'
    })
  }
  // eslint-disable-next-line no-console
  console.log(
    columnify(columns, {
      minWidth: 20
    })
  )
}

export const command = 'list'
export const aliases = ['ls']
export const describe = "display a list of an application's read models"
