export default options => async (
  { readModelQueryExecutors, viewModelQueryExecutors, executeCommand, body },
  iss,
  sub,
  profile,
  accessToken,
  refreshToken,
  done
) => {
  try {
    done(
      null,
      await options.authCallback(
        {
          readModelQueryExecutors,
          viewModelQueryExecutors,
          executeCommand,
          body
        },
        profile
      )
    )
  } catch (error) {
    done(error)
  }
}
