const getFormUpload = ({ dir }) => async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    const post = await adapter.getSignedPost(dir)

    res.json(post)
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default getFormUpload
