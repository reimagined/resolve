import { getHeavyReadModelTableName, makeResolvers } from './benchmark-base'

const heavyResolvers = makeResolvers(getHeavyReadModelTableName)

export default heavyResolvers
