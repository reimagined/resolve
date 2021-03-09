import fetch from 'isomorphic-fetch'

export const handler = async ({ url, saga, key }) => {
  const response = await fetch(
    `${url}/event-broker/get-property?eventSubscriber=${saga}&key=${key}`
  )
  const result = await response.text()
  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'get <saga> <key>'
export const describe = 'get property'
export const builder = (yargs) =>
  yargs
    .positional('saga', {
      describe: "an existing saga's name",
      type: 'string',
    })
    .positional('key', {
      describe: 'property name',
      type: 'string',
    })
