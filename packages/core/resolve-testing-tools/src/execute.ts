import { Phases, symbol } from './constants'

export const execute = async (pool: {
  executeSaga: Function
  executeReadModel: Function
  executeCommand: Function
  promise: {
    [symbol]: {
      phase: Phases
    }
  }
}): Promise<any> => {
  switch (pool.promise[symbol].phase) {
    case Phases.SAGA:
    case Phases.PROPERTIES: {
      return await pool.executeSaga(pool)
    }
    case Phases.READ_MODEL:
    case Phases.RESOLVER:
    case Phases.READ_MODEL_AS: {
      return await pool.executeReadModel(pool)
    }
    case Phases.AGGREGATE:
    case Phases.COMMAND:
    case Phases.COMMAND_AS: {
      return await pool.executeCommand(pool)
    }
    default: {
      throw new TypeError()
    }
  }
}
