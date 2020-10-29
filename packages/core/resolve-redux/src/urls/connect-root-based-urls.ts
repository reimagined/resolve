import { useOriginResolver } from 'resolve-react-hooks'
import createContextBasedConnector from './create-context-based-connector'

const connectStaticBasedUrls = createContextBasedConnector(useOriginResolver)

export { connectStaticBasedUrls }
