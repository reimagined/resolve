import fetch from 'isomorphic-fetch'

export const handler = async ({ url, saga, timestamp }) => {
  const response = await fetch(
    `${url}/event-broker/reset?eventSubscriber=${saga}`
  )
  if (timestamp != null) {
    await fetch(
      `${url}/event-broker/set-property?eventSubscriber=${saga}&key=RESOLVE_SIDE_EFFECTS_START_TIMESTAMP&value=${Date.parse(
        timestamp
      )}`
    )
  }
  const result = await response.text()
  //eslint-disable-next-line no-console
  console.log(result)
}

export const command = 'reset <saga>'
export const describe = "reset a saga's state"
export const builder = (yargs) =>
  yargs
    .positional('saga', {
      describe: "an existing saga's name",
      type: 'string',
    })
    .option('side-effects-start-timestamp', {
      alias: 'timestamp',
      type: 'string',
    })
