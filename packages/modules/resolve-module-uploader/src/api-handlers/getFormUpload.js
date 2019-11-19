const getFormUpload = async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    const post = await adapter.getSignedPost('logo')

    res.json(post)
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default getFormUpload
