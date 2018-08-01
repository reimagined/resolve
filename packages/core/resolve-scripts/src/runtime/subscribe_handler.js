import println from './utils/println'
import subscribeAdapter from './subscribe_adapter'

const subscribeHandler = async (req, res) => {
  const { origin } = req.arguments

  try {
    return res.json(await subscribeAdapter.getOptions(origin))
  } catch (err) {
    println.error(err)
    res.status(500).end(err.toString())
  }
}

export default subscribeHandler
