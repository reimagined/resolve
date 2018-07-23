import sinon from 'sinon'

let lastResult = null
let lastError = null

export const _setLastResult = result => (lastResult = result)
export const _setLastError = error => (lastError = error)

const createMysql2 = () => ({
  createConnection: sinon.stub().callsFake(async () => {
    if (lastError != null) {
      throw lastError
    }
    return {
      execute: sinon.stub().callsFake(async () => {
        if (lastError != null) {
          throw lastError
        }
        return lastResult
      })
    }
  }),
  counter: Math.random()
})

const mysql2 = createMysql2()

export const _reset = () => {
  Object.assign(mysql2, createMysql2())
  lastResult = null
  lastError = null
}

export default mysql2
