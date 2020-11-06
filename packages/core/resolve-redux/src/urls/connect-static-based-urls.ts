import { useStaticResolver } from 'resolve-react-hooks'
import createContextBasedConnector from './create-context-based-connector'

const connectStaticBasedUrls = createContextBasedConnector(useStaticResolver)

export { connectStaticBasedUrls }
