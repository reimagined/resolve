import jwt from 'jsonwebtoken'

const getFormUpload = ({ dir, jwtSecret }) => async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    const post = await adapter.getSignedPost(dir)

    await req.resolve.executeCommand({
      type: 'createSignedUrl',
      aggregateId: post.uploadId,
      aggregateName: 'Uploader',
      payload: {
        uploadId: post.uploadId
      },
      jwtToken: jwt.sign(post.uploadId, jwtSecret)
    })

    await res.json(post)
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default getFormUpload
