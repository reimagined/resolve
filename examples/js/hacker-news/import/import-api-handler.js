const importApiHandler = () => async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Import API handler should not be used in production mode')
  }
  try {
    await req.resolve.eventstoreAdapter.saveEvent(JSON.parse(req.body))
    await res.end('Ok')
  } catch (error) {
    await res.status(500)
    const outError =
      error != null && error.stack != null ? `${error.stack}` : `${error}`
    await res.end(outError)
  }
}
export default importApiHandler
