const enhancer = () => (createStore) => (...args) => createStore(...args)

export default enhancer
