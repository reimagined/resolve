export default [
  () => next => action => {
    console.log(action)

    next(action)
  }
]
