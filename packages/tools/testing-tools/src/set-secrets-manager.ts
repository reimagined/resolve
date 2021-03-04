import { symbol, Phases } from './constants'

const setSecretsManager = (
  {
    promise,
  }: {
    promise: any
  },
  secretsManager: any
) => {
  if (promise[symbol].phase !== Phases.GIVEN_EVENTS) {
    throw new TypeError()
  }

  promise[symbol].secretsManager = secretsManager

  return promise
}

export default setSecretsManager
