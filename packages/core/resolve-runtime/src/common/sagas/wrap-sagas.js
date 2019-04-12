import wrapRegularSagas from './wrap-regular-sagas'
import wrapSchedulerSagas from './wrap-scheduler-sagas'

const wrapSagas = (sagas, resolve) => {
  return [
    ...wrapRegularSagas(
      sagas.filter(({ isSystemScheduler }) => !isSystemScheduler),
      resolve
    ),
    ...wrapSchedulerSagas(
      sagas.filter(({ isSystemScheduler }) => isSystemScheduler),
      resolve
    )
  ]
}

export default wrapSagas
