const handler = async (req, res): Promise<void> => {
  try {
    const adapter = req.resolve.eventstoreAdapter
    await adapter.unfreeze()
    await res.end('OK')
  } catch (error) {
    await res.status(500)
    await res.end(error)
  }
}

export default handler
