import jwt from 'jsonwebtoken'
import { systemToken } from '../jwt'

const currentUserProfileSign = async () => {
  const userId = '22028775-af90-4e70-9bc8-ccd6e95faf5c' // TODO: get userId
  return jwt.sign({ userId }, process.env.JWT_WM_SECRET)
}

const currentUserProfileVerify = async ({ resolve }, { jwt: token }) => {
  const { userId } = jwt.verify(token, process.env.JWT_WM_SECRET)
  let user = null
  try {
    user = await resolve.executeQuery({
      modelName: 'user-profiles',
      resolverName: 'profileById',
      resolverArgs: { userId },
      jwtToken: systemToken()
    })
  } catch (error) {
    console.log('currentUserProfileResolver ERROR', error)
  }

  console.log('currentUserProfileVerify userId', userId)
  console.log('currentUserProfileVerify user', user)

  if (
    user == null ||
    !user ||
    userId === '22028775-af90-4e70-9bc8-ccd6e95faf5c'
  ) {
    throw new Error('Permission denied')
  }

  console.log('currentUserProfileVerify userId', userId)

  return { verified: true }
}

export default {
  sign: currentUserProfileSign,
  verify: currentUserProfileVerify
}
