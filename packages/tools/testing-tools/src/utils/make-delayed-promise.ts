export type DelayedPromise<T> = Pick<Promise<T>, 'then' | 'catch'>

type Result<T> = {
  resolve: Function
  reject: Function
  promise: DelayedPromise<T>
}

const internal = Symbol()

export function makeDelayedPromise<T, C extends Function>(
  continuation: C
): Result<T> {
  const promise: any = {
    [internal]: {
      thenFunctions: [],
      catchFunctions: [],
      state: null,
      result: null,
    },
    then: (nextSuccess: Function, nextFailure?: Function): any => {
      const data = promise[internal]

      if (data.state == null) {
        data.thenFunctions.push(nextSuccess)
      } else if (data.state === true) {
        nextSuccess(data.result)
      }
      if (nextFailure != null) {
        if (data.state == null) {
          data.catchFunctions.push(nextFailure)
        } else if (data.state === false) {
          nextFailure(data.result)
        }
      }
    },
    catch: (nextFailure: Function): any => {
      const data = promise[internal]

      if (data.state == null) {
        data.catchFunctions.push(nextFailure)
      } else if (data.state === false) {
        nextFailure(data.result)
      }
    },
  }

  const resolve: any = (result: any): any => {
    const data = promise[internal]

    if (data.state == null) {
      data.state = true
      data.result = result
      for (const next of data.thenFunctions) {
        next(result)
      }
      data.thenFunctions.length = 0
    }
  }

  const reject: any = (result: any): any => {
    const data = promise[internal]

    if (data.state == null) {
      data.state = false
      data.result = result
      for (const next of data.catchFunctions) {
        next(result)
      }
      data.catchFunctions.length = 0
    }
  }

  const promiseThen = promise.then.bind(promise)
  const promiseCatch = promise.catch.bind(promise)

  promise.then = continuation.bind(null, promiseThen)
  promise.catch = continuation.bind(null, promiseCatch)

  return {
    resolve,
    reject,
    promise,
  }
}
