import path from 'path'

const upload = async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    const { uploadUrl, uploadId } = await adapter.getSignedPut({ dir: '' })

    const filePath = path.join(__dirname, 'test.png')

    await adapter.uploadPut(uploadUrl, filePath)

    res.end(`${uploadId}`)
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default upload
