import jwt from 'jsonwebtoken'

export default [
  {
    name: 'me',

    projection: {
      Init: () => {}
    },

    resolvers: {
      me: async (store, { jwtToken }) => {
        if (!jwtToken) {
          return null
        }
        const user = await jwt.verify(
          jwtToken,
          process.env.JWT_SECRET || 'SECRETJWT'
        )

        return user // */ return null
      }
    }
  }
]
