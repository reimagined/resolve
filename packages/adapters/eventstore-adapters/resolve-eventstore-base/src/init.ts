import { AdapterPoolConnectedProps, AdapterPoolConnected } from './types'

const init = async <ConnectedProps extends AdapterPoolConnectedProps>({
  initEvents,
  initSecrets,
  initFinal,
  maybeThrowResourceError,
}: AdapterPoolConnected<ConnectedProps>): Promise<void> => {
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
