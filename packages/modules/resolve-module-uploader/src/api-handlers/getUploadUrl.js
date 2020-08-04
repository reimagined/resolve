import jwt from 'jsonwebtoken'

const getUploadUrl = ({ jwtSecret }) => async (req, res) => {
  const adapter = req.resolve.uploader
  try {
    jwt.verify(req.jwt, jwtSecret)

    const { dir } = req.query
    const signedPut = await adapter.getSignedPut(dir)

    await res.json(signedPut)
  } catch (error) {
    await res.status(405)
    await res.end(error.toString())
  }
}

export default getUploadUrl
