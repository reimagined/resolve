import getRootBasedUrl from './get-root-based-url'
import createContextBasedConnector from './create-context-based-connector'

const connectRootBasedUrls = createContextBasedConnector(
  (
    {
      origin,
      rootPath
    }: {
      origin: string
      rootPath: string
    },
    path: string
  ) => getRootBasedUrl(origin, rootPath, path)
)

export default connectRootBasedUrls
