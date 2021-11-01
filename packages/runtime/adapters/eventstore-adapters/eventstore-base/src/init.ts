import { AdapterBoundPool } from './types'

const init = async <ConfiguredProps extends {}>({
  initEvents,
  initSecrets,
  initFinal,
  maybeThrowResourceError,
}: AdapterBoundPool<ConfiguredProps>): Promise<void> => {
  const errorsArrays = await Promise.all([initEvents(), initSecrets()])
  const finalErrors = await initFinal()
  const errors: any[] = []
  for (const errorsArray of errorsArrays) {
    errors.push(...errorsArray)
  }
  errors.push(...finalErrors)
  maybeThrowResourceError(errors)
}

export default init
