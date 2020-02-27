import { assertLeadingSlash } from './assertions'

const regExpAbsoluteUrl = new RegExp('^(?:[a-z]+:)?//', 'i')

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
