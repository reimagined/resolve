function mainSaga({ executeCommand }) {
  const commandEmitter = async () => {
    const timestamp = Math.floor(Date.now() / 1000)
    await executeCommand({
      aggregateId: 'root-id',
      aggregateName: 'News',
      type: 'addNews',
      payload: {
        content: `Sample news at ${timestamp} timestamp`,
        timestamp
      }
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    await commandEmitter()
  }

  // eslint-disable-next-line no-console
  commandEmitter().catch(error => console.log('Saga error:', error))
}

export default [mainSaga]
