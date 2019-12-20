import md5 from 'md5'
import jwt from 'jsonwebtoken'

const getJwtToken = async (store, { login, password }) => {
  const passwordHash = md5(password)

  const [user] =
    (await store.find('Users', {
      login,
      passwordHash
    })) || []

  if (user == null) {
    const error = new Error('Incorrect login or password')
    error.code = 404
    throw error
  }

  if (!process.env.hasOwnProperty('JWT_SECRET')) {
    throw new Error('Environment variable JWT_SECRET not defined')
  }

  return jwt.sign({ login, passwordHash }, process.env.JWT_SECRET)
}

const getUser = async (store, { login }) => {
  const user = login != null ? await store.findOne('Users', { login }) : null

  return user
}

export default {
  getJwtToken,
  user: getUser
}
