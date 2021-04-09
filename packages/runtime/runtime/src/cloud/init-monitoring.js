import createMonitoring from './monitoring'

const initMonitoring = (resolve) => {
  resolve.monitoring = createMonitoring(resolve.resolveVersion)
}

export default initMonitoring
