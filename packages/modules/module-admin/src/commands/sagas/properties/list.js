import fetch from 'isomorphic-fetch'
import columnify from 'columnify'

export const handler = async ({ url, saga }) => {
  const response = await fetch(
    `${url}/event-broker/list-properties?eventSubscriber=${saga}`
  )
  const result = await response.json()
  if (result.hasOwnProperty('RESOLVE_SIDE_EFFECTS_START_TIMESTAMP')) {
    result.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP = new Date(
      +result.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP
    )
  }
  //eslint-disable-next-line no-console
  console.log(
    columnify(result, {
      minWidth: 20,
      columns: ['name', 'value'],
    })
  )
}

export const command = 'list <saga>'
export const aliases = ['ls']
export const describe = "display a list of an application's sagas"
export const builder = (yargs) =>
  yargs.positional('saga', {
    describe: "an existing saga's name",
    type: 'string',
  })
