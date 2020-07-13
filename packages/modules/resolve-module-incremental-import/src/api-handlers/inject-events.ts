import wrapRequest from './wrap-request'

const handler = async (req, res) => {
  const request = wrapRequest(req)

  const events = request.body

  try {
    const adapter = req.resolve.eventstoreAdapter
    await adapter.injectEvents(events)
    await res.end('OK')
  } catch(error) {
    await res.status(500)
    await res.end(error)
  }
}

export default handler
