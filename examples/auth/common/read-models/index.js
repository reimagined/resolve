import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwtSecret'

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
        const user = await jwt.verify(jwtToken, jwtSecret)
        if (!user.name) {
          return null
        }

        return user
      }
    }
  }
]
