import executeStrategy from './execute_strategy'
import wrapAuthRequest from './wrap_auth_request'
import sendAuthResponse from './send_auth_response'

const apiHandlerConstructor = (
  { strategyHash, options },
  { createStrategy, callback }
) => async (req, res) => {
  try {
    const authRequest = wrapAuthRequest(req)

    const authResponse = await executeStrategy(
      authRequest,
      createStrategy,
      options,
      strategyHash,
      callback
    )

    const noredirect =
      (authRequest.body &&
        authRequest.body.noredirect &&
        String(authRequest.body.noredirect) === 'true') ||
      (authRequest.query &&
        authRequest.query.noredirect &&
        String(authRequest.query.noredirect) === 'true')

    await sendAuthResponse(
      authResponse,
      res,
      authRequest.resolve.rootPath,
      noredirect
    )
  } catch (error) {
    res.status(504)

    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`

    res.end(outError)
  }
}

export default apiHandlerConstructor
