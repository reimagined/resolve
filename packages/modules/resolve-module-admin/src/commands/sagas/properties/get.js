import fetch from 'isomorphic-fetch'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/get-property?listenerId=${args.saga}&key=${args.key}`
    )
    const result = await response.text()
    console.log(result)
  } catch (e) {
    console.log(e)
  }
}

export const command = 'get <saga> <key>'
export const describe = 'get property'
export const builder = yargs =>
  yargs
    .positional('saga', {
      describe: "an existing saga's name",
      type: 'string'
    })
    .positional('key', {
      describe: 'property name',
      type: 'string'
    })
