import fetch from 'isomorphic-fetch'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/delete-property?listenerId=${args.saga}&key=${args.name}`
    )
    const result = await response.text()
    console.log(result)
  } catch (e) {
    console.log(e)
  }
}

export const command = 'remove <saga> <name>'
export const aliases = ['rm']
export const describe = 'remove a saga property'
export const builder = yargs =>
  yargs
    .positional('saga', {
      describe: "an existing saga's name",
      type: 'string'
    })
    .positional('name', {
      describe: 'property name',
      type: 'string'
    })
