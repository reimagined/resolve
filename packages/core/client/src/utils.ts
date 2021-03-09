import { assertLeadingSlash } from './assertions'

const regExpAbsoluteUrl = new RegExp('^(?:[a-z]+:)?//', 'i')

export const isString = (value: any): value is string =>
  value != null && value.constructor === String

export const isAbsoluteUrl = (value: string): boolean =>
  regExpAbsoluteUrl.test(value)

export const getRootBasedUrl = (
  rootPath: string,
  path: string,
  origin?: string
): string => {
  if (isAbsoluteUrl(path)) {
    return path
  }

  assertLeadingSlash(path, 'Path')

  return `${origin ?? ''}${rootPath ? `/${rootPath}` : ''}${path}`
}

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
