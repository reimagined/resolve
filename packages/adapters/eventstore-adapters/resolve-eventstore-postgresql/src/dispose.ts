import getLog from './js/get-log'

const dispose = async (): Promise<any> => {
  const log = getLog(`dispose`)
  log.debug(`disposing the adapter`)
}

export default dispose
