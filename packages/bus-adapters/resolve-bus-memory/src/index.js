function createAdapter() {
  let handler = () => {};

  return {
    subscribe: callback => (handler = callback),
    publish: event => handler(event)
  };
}

export default createAdapter;
