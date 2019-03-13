import { symbol } from './constants'

const getInitPromise = ({ promise }) =>
  new Promise(initResolve => {
    promise[symbol].initResolve = async (continuation, ...args) => {
      initResolve()
      return await continuation(...args)
    }
  })

export default getInitPromise
