import { ClientMiddlewareParameters, ClientMiddleware } from '../middleware'

const parseResponse = async (
  response: Response,
  params: ClientMiddlewareParameters
) => {
  const result = await response.json()
  const { deserializer } = params
  if (
    typeof deserializer === 'function' &&
    result != null &&
    result.data != null
  ) {
    result.data = deserializer(result.data)
  }
  params.end({
    result,
    headers: response.headers,
  })
}

export const createParseResponseMiddleware = (): ClientMiddleware<Response> =>
  parseResponse.bind(null)
