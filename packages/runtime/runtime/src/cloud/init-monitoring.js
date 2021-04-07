import createMonitoring from './monitoring'

const initMonitoring = (resolve) => {
  resolve.monitoring = createMonitoring()
}

export default initMonitoring
