import {
  RequestMiddlewareParameters,
  RequestMiddleware,
} from '../request-middleware'

const parseResponse = async (
  response: Response,
  params: RequestMiddlewareParameters
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

export const createParseResponseMiddleware = (): RequestMiddleware<Response> =>
  parseResponse.bind(null)
