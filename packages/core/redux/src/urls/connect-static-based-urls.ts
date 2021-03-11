import { useStaticResolver } from '@resolve-js/react-hooks'
import createContextBasedConnector from './create-context-based-connector'

const connectStaticBasedUrls = createContextBasedConnector(useStaticResolver)

export { connectStaticBasedUrls }
