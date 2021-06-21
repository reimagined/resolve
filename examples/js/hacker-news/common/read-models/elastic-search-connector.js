import { Client } from '@elastic/elasticsearch'
const connect = (options) => async () =>
  options.node ? new Client(options) : null
const drop = async (client) => {
  if (client) await client.indices.delete({ index: 'primary' })
}
const createConnector = (options) => ({
  connect: connect(options),
  drop,
})
export default createConnector
