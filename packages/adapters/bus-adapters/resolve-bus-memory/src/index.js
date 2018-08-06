function createAdapter() {
  let handler = () => {}

  return {
    init: () => {},
    close: () => {},
    subscribe: callback => (handler = callback),
    publish: event => handler(event)
  }
}

export default createAdapter
