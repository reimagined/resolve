import getStaticBasedUrl from './get-static-based-url'
import createContextBasedConnector from './create-context-based-connector'

const connectStaticBasedUrls = createContextBasedConnector(
  (
    {
      origin,
      rootPath,
      staticPath
    }: {
      origin: string
      rootPath: string
      staticPath: string
    },
    path: string
  ) => getStaticBasedUrl(origin, rootPath, staticPath, path)
)

export default connectStaticBasedUrls
