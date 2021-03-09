const checkMaintenanceMode = (maintenanceMode) => {
  if (
    maintenanceMode !== undefined &&
    maintenanceMode !== 'auto' &&
    maintenanceMode !== 'manual'
  ) {
    throw new Error(`Incorrect maintenanceMode = ${maintenanceMode}`)
  }
}

export default checkMaintenanceMode
