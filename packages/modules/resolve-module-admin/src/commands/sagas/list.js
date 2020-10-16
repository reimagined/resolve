import fetch from 'isomorphic-fetch'
import columnify from 'columnify'
import dateFormat from 'dateformat'

export const handler = async ({ url }) => {
  const response = await fetch(`${url}/event-broker/sagas-list`)
  const result = await response.json()
  if (result.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Sagas is not defined')
    return
  }
  const columns = []
  for (const {
    eventSubscriber,
    status,
    successEvent,
    failedEvent,
    errors,
  } of result) {
    columns.push({
      name: eventSubscriber,
      status,
      'success event': successEvent
        ? `${dateFormat(new Date(successEvent.timestamp), 'm/d/yy HH:MM:ss')} ${
            successEvent.type
          }`
        : 'N\\A',
      'failed event': failedEvent
        ? `${dateFormat(new Date(failedEvent.timestamp), 'm/d/yy HH:MM:ss')} ${
            failedEvent.type
          }`
        : 'N\\A',
      'last error': errors ? errors[errors.length - 1].message : 'N\\A',
    })
  }
  // eslint-disable-next-line no-console
  console.log(
    columnify(columns, {
      minWidth: 20,
    })
  )
}

export const command = 'list'
export const aliases = ['ls']
export const describe = "display a list of an application's sagas"
