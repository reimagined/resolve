import jwt from 'jsonwebtoken'

const currentUserProfileResolver = async ({ resolve }, { jwt: token }) => {
  const { userId } = jwt.verify(token, process.env.JWT_WM_SECRET)
  const user = await resolve.executeQuery({
    modelName: 'user-profiles',
    resolverName: 'profileById',
    resolverArgs: { userId }
  })

  if (!user) {
    throw new Error('Permission denied')
  }

  return { verified: true }
}

export default currentUserProfileResolver
