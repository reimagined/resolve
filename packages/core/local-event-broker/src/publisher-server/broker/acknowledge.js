import { LazinessStrategy, PrivateOperationType } from '../constants'

const acknowledge = async (pool, payload) => {
  const { invokeOperation } = pool
  const { batchId, result } = payload
  const input = {
    type: PrivateOperationType.ACKNOWLEDGE_BATCH,
    payload: {
      batchId,
      result,
    },
  }
  await invokeOperation(pool, LazinessStrategy.EAGER, input)
}

export default acknowledge
