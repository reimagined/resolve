import getLog from 'resolve-debug-levels'

const disposeEventStore = async ({ events: { connection } }) => {
  const log = getLog(`disposeEventStore`)

  log.debug(`closing mysql connection`)
  await connection.end()
  log.debug(`mysql connection closed`)
}

export default disposeEventStore
