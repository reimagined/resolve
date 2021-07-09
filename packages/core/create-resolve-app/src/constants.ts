export const analyticsUrlBase = 'https://ga-beacon.appspot.com/UA-118635726-2'
export const resolveVersion = process.env.__RESOLVE_VERSION__
export const resolvePackages = JSON.parse(
  process.env.__RESOLVE_PACKAGES__ ?? ''
)
export const resolveExamples = JSON.parse(
  process.env.__RESOLVE_EXAMPLES__ ?? ''
)
export const localRegistry = {
  protocol: 'http',
  host: '0.0.0.0',
  port: 10080,
}
