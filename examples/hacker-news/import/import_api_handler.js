const importApiHandler = (
  { storageAdapterOptions },
  { storageAdapterModule }
) => async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Import API handler should not be used in production mode')
  }

  try {
    if (req.resolve.storageAdapter == null) {
      req.resolve.storageAdapter = storageAdapterModule(storageAdapterOptions)
    }
    const args = JSON.parse(req.body)

    if (args.dropEvents != null) {
      await req.resolve.storageAdapter.dispose({ dropEvents: true })
      req.resolve.storageAdapter = null
    } else if (args.saveEvent != null) {
      await req.resolve.storageAdapter.saveEvent(args.saveEvent)
    } else {
      throw new Error(`Wrong arguments: ${args}`)
    }

    await res.end('Ok')
  } catch (error) {
    await res.status(500)

    const outError =
      error != null && error.stack != null ? `${error.stack}` : `${error}`

    await res.end(outError)
  }
}

export default importApiHandler
