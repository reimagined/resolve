const getToken = ({ publicDirs, expireTime }) => async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    const { dir } = req.query
    for (let dirName of publicDirs) {
      if (dir === dirName) {
        return await res.end(await adapter.createToken({ dir, expireTime }))
      }
    }

    await res
      .status(403)
      .end(`Wrong dir! You can use only: ${publicDirs} dirs.`)
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default getToken
