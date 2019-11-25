const createToken = ({ dir, expireTime }) => async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    const token = await adapter.createToken({ dir, expireTime })

    res.end(token)
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default createToken
