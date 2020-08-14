import jwt from 'jsonwebtoken'
import jwtSecret from '../jwt_secret'

const getFileUrl = async (req, res) => {
  try {
    const { login } = jwt.verify(req.jwt, jwtSecret)
    const { uploadId } = req.query

    const fileData = await req.resolve.executeQuery({
      modelName: 'Files',
      resolverName: 'file',
      resolverArgs: { uploadId }
    })

    if (fileData == null || fileData.status !== 'success') {
      throw new Error('File not loaded')
    }

    if (login !== fileData.userId) {
      throw new Error(`User - ${login} cannot access file`)
    }

    const dir = `${fileData.userId}/${fileData.projectId}`

    const token = await req.resolve.uploader.createToken({ dir })

    const url = `/${dir}/${uploadId}?token=${token}`

    await res.end(url)
  } catch (error) {
    await res.status(405)
    await res.end(error.toString())
  }
}

export default getFileUrl
