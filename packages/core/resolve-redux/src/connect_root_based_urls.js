import getRootBasedUrl from './get_root_based_url'
import createContextBasedConnector from './create_context_based_connector'

const connectRootBasedUrls = createContextBasedConnector(
  ({ origin, rootPath }, path) => getRootBasedUrl(origin, rootPath, path)
)

export default connectRootBasedUrls
