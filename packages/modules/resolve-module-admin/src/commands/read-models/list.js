import fetch from 'isomorphic-fetch'
import columnify from 'columnify'
import dateFormat from 'dateformat'

export const handler = async args => {
  try {
    const response = await fetch(`${args.url}/event-broker/status-all`)
    const result = await response.json()
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
    console.log(
      columnify(columns, {
        minWidth: 20
      })
    )
  } catch (e) {}
}

export const command = 'list'
export const aliases = ['ls']
export const describe = "display a list of an application's read models"
