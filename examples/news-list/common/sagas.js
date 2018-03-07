function mainSaga({ executeCommand }) {
  const pushInterval =
    Number.isSafeInteger(+process.env.PUSH_INTERVAL) &&
    +process.env.PUSH_INTERVAL > 10 &&
    +process.env.PUSH_INTERVAL < 3000
      ? +process.env.PUSH_INTERVAL
      : 1000

  const commandEmitter = async () => {
    const timestamp = Math.floor(Date.now() / 10) % Math.pow(2, 31)
    await executeCommand({
      aggregateId: 'root-id',
      aggregateName: 'News',
      type: 'addNews',
      payload: {
        content: `Example news at ${timestamp} timestamp`,
        timestamp
      }
    })
    await new Promise(resolve => setTimeout(resolve, pushInterval))
    await commandEmitter()
  }

  // eslint-disable-next-line no-console
  commandEmitter().catch(error => console.log('Saga error:', error))
}

export default [mainSaga]
