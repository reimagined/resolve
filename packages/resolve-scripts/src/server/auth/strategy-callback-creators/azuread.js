export default options => async (
  { resolve, body },
  iss,
  sub,
  profile,
  accessToken,
  refreshToken,
  done
) => {
  try {
    done(null, await options.authCallback({ resolve, body }, profile))
  } catch (error) {
    done(error)
  }
}
