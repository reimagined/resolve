import { getRouteByName } from '../helpers'

export default options => async (req, username, password, done) => {
  try {
    const path = req.originalUrl.split('?')[0]
    const { resolve, body } = req
    const value =
      path === getRouteByName('register', options.routes).path
        ? await options.registerCallback({ resolve, body }, username, password)
        : await options.loginCallback({ resolve, body }, username, password)
    done(null, value)
  } catch (error) {
    done(error)
  }
}
