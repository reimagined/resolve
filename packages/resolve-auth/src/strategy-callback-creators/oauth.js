export default options => async (
  { resolve, body },
  accessToken,
  refreshToken,
  profile,
  done
) => {
  try {
    done(null, await options.authCallback({ resolve, body }, profile))
  } catch (error) {
    done(error)
  }
}
