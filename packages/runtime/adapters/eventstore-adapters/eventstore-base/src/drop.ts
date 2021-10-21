import { AdapterBoundPool } from './types'

const drop = async <ConnectedProps extends {}>({
  dropEvents,
  dropSecrets,
  dropFinal,
  maybeThrowResourceError,
}: AdapterBoundPool<ConnectedProps>): Promise<void> => {
  const errorsArrays = await Promise.all([dropEvents(), dropSecrets()])
  const finalErrors = await dropFinal()
  const errors: any[] = []
  for (const errorsArray of errorsArrays) {
    errors.push(...errorsArray)
  }
  errors.push(...finalErrors)
  maybeThrowResourceError(errors)
}

export default drop
