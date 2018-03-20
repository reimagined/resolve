import jwt from 'jsonwebtoken'

export default [
  {
    name: 'President',
    commands: {
      like: (state, command, jwtToken) => {
        const { username } = jwt.verify(jwtToken, process.env.JWT_SECRET)
        return {
          type: 'LIKE',
          payload: { username }
        }
      }
    }
  }
]
