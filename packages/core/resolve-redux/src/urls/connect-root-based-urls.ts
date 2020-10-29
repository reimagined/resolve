import { useOriginResolver } from 'resolve-react-hooks'
import createContextBasedConnector from './create-context-based-connector'

const connectRootBasedUrls = createContextBasedConnector(useOriginResolver)

export { connectRootBasedUrls }
