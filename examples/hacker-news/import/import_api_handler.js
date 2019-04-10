const importAdapterSymbol = Symbol('IMPORT_ADAPTER_SYMBOL')

const importApiHandler = (
  { storageAdapterOptions, isImporter },
  { storageAdapterModule }
) => async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Import API handler should not be used in production mode')
  }
  const resolveBase = Object.getPrototypeOf(req.resolve)

  try {
    if (resolveBase[importAdapterSymbol] == null) {
      resolveBase[importAdapterSymbol] = storageAdapterModule({
        ...storageAdapterOptions,
        isImporter
      })
    }
    const args = JSON.parse(req.body)

    if (args.dropEvents != null) {
      await resolveBase[importAdapterSymbol].dispose({ dropEvents: true })
      resolveBase[importAdapterSymbol] = null
    } else if (args.saveEvent != null) {
      await resolveBase[importAdapterSymbol].saveEvent(args.saveEvent)
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
