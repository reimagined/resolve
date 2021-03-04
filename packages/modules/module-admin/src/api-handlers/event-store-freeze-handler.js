import wrapApiHandler from './wrap-api-handler'
import { EventstoreAlreadyFrozenError } from '@resolve-js/eventstore-base'

const pause = async (req, res) => {
  try {
    const { eventstoreAdapter } = req.resolve
    await eventstoreAdapter.freeze()
    res.end(`EventStore is frozen`)
  } catch (error) {
    if (EventstoreAlreadyFrozenError.is(error)) {
      res.end(`EventStore is already frozen`)
    } else {
      // eslint-disable-next-line no-console
      console.warn(error)

      res.status(500)
      res.end(`${error}`)
    }
  }
}

export default wrapApiHandler(pause)
