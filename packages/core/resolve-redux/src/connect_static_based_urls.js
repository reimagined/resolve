import getStaticBasedUrl from './get_static_based_url'
import createContextBasedConnector from './create_context_based_connector'

const connectStaticBasedUrls = createContextBasedConnector(
  ({ origin, rootPath, staticPath }, path) =>
    getStaticBasedUrl(origin, rootPath, staticPath, path)
)

export default connectStaticBasedUrls
