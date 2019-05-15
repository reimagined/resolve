import { Phases, symbol } from './constants'

const init = async pool => {
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

export default init
