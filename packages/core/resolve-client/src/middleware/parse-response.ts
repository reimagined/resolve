import { ClientMiddlewareParameters, ClientMiddleware } from '../middleware'
import { readJSONOrText } from '../utils'

const parseResponse = async (
  response: Response,
  params: ClientMiddlewareParameters
) => {
  const result = await readJSONOrText<{ data: any }>(response)

  if (typeof result === 'string') {
    return result
  }

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
