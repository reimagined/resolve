import jwt from 'jsonwebtoken'

const getFormUpload = ({ jwtSecret }) => async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    jwt.verify(req.jwtToken, jwtSecret)

    const { dir } = req.query
    const signedPost = await adapter.getSignedPost(dir)

    await res.json(signedPost)
  } catch (error) {
    await res.status(405)
    await res.end(error)
  }
}

export default getFormUpload
