import executeStrategy from './execute_strategy'
import wrapAuthRequest from './wrap_auth_request'
import sendAuthResponse from './send_auth_response'

const apiHandlerConstructor = (
  { strategyHash, varyOptions },
  { createStrategy, callback }
) => async (req, res) => {
  try {
    const authRequest = wrapAuthRequest(req)

    const authResponse = await executeStrategy(
      authRequest,
      createStrategy,
      varyOptions,
      strategyHash,
      callback
    )

    await sendAuthResponse(authResponse, res, authRequest.resolve.rootPath)
  } catch (error) {
    res.status(504)
    res.end(String(error.stack))
  }
}

export default apiHandlerConstructor
