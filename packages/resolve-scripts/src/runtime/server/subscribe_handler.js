import println from './utils/println'
import subscribeAdapter from './subscribe_adapter'

const subscribeHandler = async (req, res) => {
  if(req.method !== 'GET' && req.method !== 'POST') {
    res.status(500).end()
    return
  }
  
  const { origin } = req[req.method === 'POST' ? 'body' : 'query']
  
  try {
    return res.json(
      await subscribeAdapter.getOptions(origin)
    )
  } catch (err) {
    println.error(err)
    res.status(500).end(err.toString())
  }
}

export default subscribeHandler
