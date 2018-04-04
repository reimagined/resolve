import { getRouteByName } from '../helpers'

export default options => async (req, username, password, done) => {
  try {
    const path = req.originalUrl.split('?')[0]
    const { resolve, body } = req
    let value = null
    if (path === getRouteByName('register', options.routes).path) {
      value = await options.registerCallback(
        { resolve, body },
        username,
        password
      )
    } else if (path === getRouteByName('login', options.routes).path) {
      value = await options.loginCallback({ resolve, body }, username, password)
    } else if (path === getRouteByName('logout', options.routes).path) {
      value = await options.logoutCallback(
        { resolve, body },
        username,
        password
      )
    }

    done(null, value)
  } catch (error) {
    done(error)
  }
}
