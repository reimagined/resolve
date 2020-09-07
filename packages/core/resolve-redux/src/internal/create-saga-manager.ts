import { fork, cancel } from 'redux-saga/effects'

const createSagaManager = (): any => {
  const sagas: { [key: string]: any } = {}

  return {
    *start(key: string, saga: any, ...sagaArgs: any[]): any {
      if (!Array.isArray(sagas[key])) {
        sagas[key] = []
      }
      const sagaId = yield fork(saga, ...sagaArgs)

      sagas[key].push(sagaId)

      return sagaId
    },

    *stop(key: string, callback: Function): any {
      if (Array.isArray(sagas[key])) {
        for (const sagaId of sagas[key]) {
          yield cancel(sagaId)
        }
      }

      delete sagas[key]
      if (typeof callback === 'function') {
        callback()
      }
    },
  }
}

export default createSagaManager
