const createAdapter = ({ execute, errorHandler = async () => {} }) => {
  // TODO: bind to a state machine ARN

  return {
    async addEntries(entries) {
      // TODO: start execution for every entry (paged)
    },
    async clearEntries() {
      // TODO: remove all active executions (in running state, paged)
    },
    async handleExternalEvent(event) {
      console.log('EXTERNAL EVENT!!!')
      console.log(`${event}`)
    }

  }
}

export default createAdapter
