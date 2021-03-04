import wrapApiHandler from './wrap-api-handler'

const pause = async (req, res) => {
  const { eventstoreAdapter } = req.resolve

  try {
    await eventstoreAdapter.freeze()
    res.end(`EventStore is frozen`)
  } catch (error) {
    if (error.name === 'AlreadyFrozenError') {
      res.end(`EventStore is already frozen`)
    } else {
      res.status(500)
      res.end(`${error}`)
    }
  }
}

export default wrapApiHandler(pause)
