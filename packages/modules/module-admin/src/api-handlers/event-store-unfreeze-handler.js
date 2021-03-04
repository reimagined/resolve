import wrapApiHandler from './wrap-api-handler'

const pause = async (req, res) => {
  try {
    const { eventstoreAdapter } = req.resolve
    await eventstoreAdapter.unfreeze()
    res.end(`EventStore is unfrozen`)
  } catch (error) {
    if (error.name === 'AlreadyUnfrozenError') {
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
