import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

export default async (resolve, params, { jwt: token, viewModel }) => {
  try {
    jwt.verify(token, jwtSecret)
  } catch (error) {
    throw new Error('Permission denied')
  }

  return await resolve.buildViewModel(viewModel.name, params)
}
