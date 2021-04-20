const wrapApiHandler = (callback) => async (req, res) => {
  try {
    await callback(req, res)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error)
    const code = error.code != null ? error.code : 500
    res.status(code)
    res.end(`${error}`)
  }
}

export default wrapApiHandler
