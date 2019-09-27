import fetch from 'isomorphic-fetch'
import columnify from 'columnify'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/list-properties?listenerId=${args.saga}`
    )
    const result = await response.json()
    console.log(
      columnify(result, {
        minWidth: 20,
        columns: ['name', 'value']
      })
    )
  } catch (e) {
    console.log(e)
  }
}

export const command = 'list <saga>'
export const aliases = ['ls']
export const describe = "display a list of an application's sagas"
export const builder = yargs =>
  yargs.positional('saga', {
    describe: "an existing saga's name",
    type: 'string'
  })
