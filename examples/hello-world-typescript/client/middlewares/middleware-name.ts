export default store => next => action => store && next(action)
