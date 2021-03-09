import fetch from 'isomorphic-fetch'

export const handler = async ({ url, readModel }) => {
  const response = await fetch(
    `${url}/event-broker/resume?eventSubscriber=${readModel}`
  )
  const result = await response.text()
  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'resume <readModel>'
export const describe = 'resume read model updates'
export const builder = (yargs) =>
  yargs.positional('readModel', {
    describe: "an existing read-model's name",
    type: 'string',
  })
