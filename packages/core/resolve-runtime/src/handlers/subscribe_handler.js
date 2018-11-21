import println from '../utils/println'

const subscribeHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    await res.status(405)
    await res.end('Invalid HTTP method for subscribe options retrieving')
    return
  }

  try {
    const parameters = req.method === 'POST' ? JSON.parse(req.body) : req.query
    const { origin, adapterName } = parameters
    await res.setHeader('Content-Type', 'application/json')
    await res.json(
      await req.resolve.getSubscribeAdapterOptions(origin, adapterName)
    )
  } catch (err) {
    println.error(err)
    await res.status(500)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(err.toString())
  }
}

export default subscribeHandler
