if (
  process.env.NODE_ENV === 'production' &&
  !process.env.hasOwnProperty('JWT_SECRET')
) {
  throw new Error(
    'In production mode you must specify jwt secret key in JWT_SECRET environment variable'
  )
}

export default process.env.JWT_SECRET || 'SECRETJWT'
