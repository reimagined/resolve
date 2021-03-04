import wrapApiHandler from './wrap-api-handler'

const pause = async (req, res) => {
  const { eventstoreAdapter } = req.resolve

  try {
    await eventstoreAdapter.unfreeze()
    res.end(`EventStore is unfrozen`)
  } catch (error) {
    if (error.name === 'AlreadyUnfrozenError') {
      res.end(`EventStore is already unfrozen`)
    } else {
      res.status(500)
      res.end(`${error}`)
    }
  }
}

export default wrapApiHandler(pause)
