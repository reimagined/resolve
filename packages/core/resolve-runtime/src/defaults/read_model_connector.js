const readModelConnector = options => ({
  async connect() {
    return options
  },
  async disconnect() {},
  async drop() {
    throw new Error('Drop read model is not implemented')
  }
})

export default readModelConnector
