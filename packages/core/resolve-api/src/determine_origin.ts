import window from 'global/window'
import { isString } from './utils'

type OriginLocation = {
  protocol: 'http:' | 'https:'
  hostname: string
  port?: string
}

const isLocation = (origin: any): origin is OriginLocation =>
  origin?.protocol && origin?.hostname

const determineOrigin = (
  origin: string | OriginLocation | undefined
): string => {
  const actualOrigin = origin ?? window?.location

  if (isLocation(actualOrigin)) {
    const { protocol, hostname, port } = actualOrigin
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }
  if (isString(actualOrigin)) {
    return actualOrigin
  }
  return ''
}

export default determineOrigin
