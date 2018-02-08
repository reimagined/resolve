import url from 'url'

export const rootDirectory = process.env.ROOT_PATH || ''

export const defaultFailureCallback = (error, redirect, { resolve, body }) =>
  redirect(
    url.format({
      pathname: `${rootDirectory}/login`,
      query: { error }
    })
  )

export const getRouteByName = (name, routes) => {
  const route = routes[name]
  const { path = route, method = 'get' } = route
  if (typeof path !== 'string') return null
  return { path, method }
}
