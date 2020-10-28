const timersMap = new WeakMap()

const fulfillMethod = (timer, value, onFulfill) => {
  timersMap.delete(timer)
  onFulfill(value)
}

const promiseMethod = (duration, timer, value, onFulfill) => {
  timersMap.set(
    timer,
    setTimeout(fulfillMethod.bind(null, timer, value, onFulfill), duration)
  )
}

const stopMethod = (timer) => {
  if (timersMap.has(timer)) {
    clearTimeout(timersMap.get(timer))
    timersMap.delete(timer)
  }
}

const makeTimer = (duration, value) => {
  const timer = {}
  timer.timerPromise = new Promise(
    promiseMethod.bind(null, duration, timer, value)
  )
  timer.timerStop = stopMethod.bind(null, timer)
  return Object.freeze(timer)
}

export default makeTimer
