const timersMap = new WeakMap()

const fullfillMethod = (timer, value, onFullfill) => {
  timersMap.delete(timer)
  onFullfill(value)
}

const promiseMethod = (duration, timer, value, onFullfill) => {
  timersMap.set(timer, setTimeout(fullfillMethod.bind(null, timer, value, onFullfill), duration))
}

const stopMethod = (timer) => {
  if(timersMap.has(timer)) {
    clearTimeout(timersMap.get(timer))
    timersMap.delete(timer)
  }
}

const makeTimer = (duration, value) => {
  const timer = {}
  timer.timerPromise = new Promise(promiseMethod.bind(null, duration, timer, value))
  timer.timerStop = stopMethod.bind(null, timer)
  return Object.freeze(timer)
}

export default makeTimer
