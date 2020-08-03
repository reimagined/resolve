import { Phases, symbol } from './constants'

export const execute = async (pool: any): Promise<any> => {
  switch (pool.promise[symbol].phase) {
    case Phases.SAGA:
    case Phases.PROPERTIES: {
      return await pool.initSaga(pool)
    }
    case Phases.READ_MODEL:
    case Phases.RESOLVER:
    case Phases.AS: {
      return await pool.initReadModel(pool)
    }
    default: {
      throw new TypeError()
    }
  }
}
