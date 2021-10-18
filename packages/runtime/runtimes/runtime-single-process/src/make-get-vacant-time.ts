const DEFAULT_WORKER_LIFETIME = 4 * 60 * 1000

const makeGetVacantTime = (lifeTime?: number) => {
  const endTime = Date.now() + (lifeTime ?? DEFAULT_WORKER_LIFETIME)
  return () => endTime - Date.now()
}

export default makeGetVacantTime
