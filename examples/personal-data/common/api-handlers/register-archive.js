const registerArchive = async (req, res) => {
  const adapter = req.resolve.uploader

  try {
    const { uploadUrl, uploadId } = await adapter.getSignedPut('archives')
    const { archiveFilePath } = JSON.parse(req.body)

    await adapter.uploadPut(uploadUrl, archiveFilePath)
    const token = await adapter.createToken({ dir: 'archives' })

    res.status(200)
    res.end(JSON.stringify({ uploadId, token }))
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default registerArchive
