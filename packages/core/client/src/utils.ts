export const isString = (value: any): value is string =>
  value != null && value.constructor === String

export async function readJSONOrText<TResponse>(
  response: Response
): Promise<TResponse | string> {
  const textData = await response.text()
  try {
    return JSON.parse(textData) as TResponse
  } catch {
    return textData
  }
}
