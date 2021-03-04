import wrapApiHandler from './wrap-api-handler'
import { EventstoreAlreadyUnfrozenError } from '@resolve-js/eventstore-base'

const pause = async (req, res) => {
  try {
    const { eventstoreAdapter } = req.resolve
    await eventstoreAdapter.unfreeze()
    res.end(`EventStore is unfrozen`)
  } catch (error) {
    if (EventstoreAlreadyUnfrozenError.is(error)) {
      res.end(`EventStore is already unfrozen`)
    } else {
      // eslint-disable-next-line no-console
      console.warn(error)

      res.status(500)
      res.end(`${error}`)
    }
  }
}

export default wrapApiHandler(pause)
