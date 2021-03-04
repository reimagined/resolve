import fetch from 'isomorphic-fetch'

export const handler = async ({ url, saga, key, value }) => {
  const response = await fetch(
    `${url}/event-broker/set-property?eventSubscriber=${saga}&key=${key}&value=${value}`
  )
  const result = await response.text()
  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'set <saga> <key> <value>'
export const describe = 'set property'
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
    .positional('value', {
      describe: 'property value',
      type: 'string',
    })
