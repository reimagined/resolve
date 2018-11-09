import println from '../utils/println'

const subscribeHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    await res.status(405)
    await res.end('Invalid HTTP method for subscribe options retrieving')
    return
  }

  const subscribeAdapter = req.resolve.subscribeAdapter
  const { origin } = req.method === 'POST' ? JSON.parse(req.body) : req.query

  try {
    await res.setHeader('Content-Type', 'application/json')
    await res.json(await subscribeAdapter.getOptions(origin))
    return
  } catch (err) {
    println.error(err)
    await res.status(500)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(err.toString())
  }
}

export default subscribeHandler
