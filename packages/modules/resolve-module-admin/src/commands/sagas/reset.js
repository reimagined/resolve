import fetch from 'isomorphic-fetch'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/reset?listenerId=${args.saga}`
    )
    const result = await response.text()
    console.log(result)
  } catch (e) {}
}

export const command = 'reset <saga>'
export const describe = "reset a saga's state"
export const builder = yargs =>
  yargs.positional('saga', {
    describe: 'an existing saga`s name',
    type: 'string'
  })
