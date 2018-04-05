export default options => async (
  { readModelQueryExecutors, viewModelQueryExecutors, executeCommand, body },
  accessToken,
  refreshToken,
  profile,
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
