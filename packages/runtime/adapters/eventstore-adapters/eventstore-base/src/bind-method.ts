import type {
  RemoveFirstType,
  AdapterPrimalPool,
  AdapterBoundPool,
} from './types'
import { AlreadyDisposedError } from './errors'

function generateAssertTrap<F extends (...args: any[]) => any>() {
  return (...args: Parameters<F>): ReturnType<F> => {
    void args
    throw new Error('Adapter method is not implemented')
  }
}

const bindMethod = <
  ConfiguredProps extends {},
  M extends (pool: AdapterBoundPool<ConfiguredProps>, ...args: any[]) => any
>(
  pool: AdapterPrimalPool<ConfiguredProps>,
  method: M | undefined
) => {
  if (method === undefined)
    return generateAssertTrap<
      (...args: RemoveFirstType<Parameters<M>>) => ReturnType<M>
    >()
  else {
    return (...args: RemoveFirstType<Parameters<M>>): ReturnType<M> => {
      if (pool.disposed) {
        throw new AlreadyDisposedError()
      }
      return method(pool as AdapterBoundPool<ConfiguredProps>, ...args)
    }
  }
}

export default bindMethod
