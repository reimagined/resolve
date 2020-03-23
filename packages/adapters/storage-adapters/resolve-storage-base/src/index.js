import createAdapter from './create-adapter'
import importStream from './import'
import exportStream from './export'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapSaveEvent from './wrap-save-event'
import wrapDispose from './wrap-dispose'
import validateEventFilter from './validate-event-filter'
import { MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL } from './constants'
import ConcurrentError from './concurrent-error'
import loadEvents from './load-events'
import getNextCursor from './get-next-cursor'

const wrappedCreateAdapter = createAdapter.bind(null, {
  importStream,
  exportStream,
  wrapMethod,
  wrapEventFilter,
  wrapSaveEvent,
  wrapDispose,
  validateEventFilter,
  loadEvents,
  getNextCursor
})

export default wrappedCreateAdapter

export { ConcurrentError, MAINTENANCE_MODE_AUTO, MAINTENANCE_MODE_MANUAL }
