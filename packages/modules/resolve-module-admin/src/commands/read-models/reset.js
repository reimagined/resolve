import fetch from 'isomorphic-fetch'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/reset?listenerId=${args.readModel}`
    )
    const result = await response.text()
    console.log(result)
  } catch (e) {}
}

export const command = 'reset <readModel>'
export const describe = "reset a read model's state (full rebuild)"
export const builder = yargs =>
  yargs.positional('readModel', {
    describe: 'an existing read-model`s name',
    type: 'string'
  })
