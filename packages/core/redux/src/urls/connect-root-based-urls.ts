import { useOriginResolver } from '@resolve-js/react-hooks'
import createContextBasedConnector from './create-context-based-connector'

const connectRootBasedUrls = createContextBasedConnector(useOriginResolver)

export { connectRootBasedUrls }
