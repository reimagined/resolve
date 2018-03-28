import jwt from 'jsonwebtoken'

export default [
  {
    name: 'me',

    projection: {
      Init: () => {}
    },

    resolvers: {
      me: async (store, { jwtToken }) => {
        console.log('me')
        if (!jwtToken) {
          return null
        }
        const user = await jwt.verify(
          jwtToken,
          process.env.JWT_SECRET || 'DefaultSecret'
        )

        console.log(user)

        return user
      }
    }
  }
]
