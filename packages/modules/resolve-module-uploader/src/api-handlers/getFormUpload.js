const getFormUpload = () => async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    const { dir } = req.query
    const signedPost = await adapter.getSignedPost(dir)

    await res.json(signedPost)
  } catch (error) {
    await res.status(405)
    await res.end(error.toString())
  }
}

export default getFormUpload
