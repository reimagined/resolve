import fetch from 'isomorphic-fetch'

export const handler = async ({ url, saga }) => {
  const response = await fetch(
    `${url}/event-broker/pause?eventSubscriber=${saga}`
  )
  const result = await response.text()
  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'pause <saga>'
export const describe = 'pause saga updates'
export const builder = (yargs) =>
  yargs.positional('saga', {
    describe: "an existing saga's name",
    type: 'string',
  })
