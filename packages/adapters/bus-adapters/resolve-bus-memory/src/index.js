function createAdapter() {
  let handler = () => {}

  return {
    init: async () => {},
    close: async () => {},
    subscribe: async callback => (handler = callback),
    publish: async event => handler(event)
  }
}

export default createAdapter
