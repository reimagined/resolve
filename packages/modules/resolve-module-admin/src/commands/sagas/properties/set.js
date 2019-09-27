import fetch from 'isomorphic-fetch'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/set-property?listenerId=${args.saga}&key=${args.key}&value=${args.value}`
    )
    const result = await response.text()
    console.log(result)
  } catch (e) {
    console.log(e)
  }
}

export const command = 'set <saga> <key> <value>'
export const describe = 'set property'
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
    .positional('value', {
      describe: 'property value',
      type: 'string'
    })
