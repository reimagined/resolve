const handler = async (req, res) => {
  try {
    const adapter = req.resolve.eventstoreAdapter
    await adapter.freeze()
    await res.end('OK')
  } catch(error) {
    await res.status(500)
    await res.end(error)
  }
}

export default handler
