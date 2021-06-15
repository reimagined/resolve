const middleware = (store) => (next) => (action) => store && next(action)

export default middleware
