import { getLiteReadModelTableName, makeResolvers } from './benchmark-base'

const liteResolvers = makeResolvers(getLiteReadModelTableName)

export default liteResolvers
