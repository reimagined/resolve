import fetch from 'isomorphic-fetch'

export const handler = async args => {
  try {
    const response = await fetch(
      `${args.url}/event-broker/resume?listenerId=${args.readModel}`
    )
    const result = await response.text()
    console.log(result)
  } catch (e) {}
}

export const command = 'resume <readModel>'
export const describe = 'resume read model updates'
export const builder = yargs =>
  yargs.positional('readModel', {
    describe: 'an existing read-model`s name',
    type: 'string'
  })
