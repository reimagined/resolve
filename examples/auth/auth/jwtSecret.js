let jwtSecret =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'development' && 'SECRETJWT')

if (!jwtSecret) {
  throw new Error(
    'In production mode you must specify jwt secret key in JWT_SECRET environment variable'
  )
}

export default jwtSecret
