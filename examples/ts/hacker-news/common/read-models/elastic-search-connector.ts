import { Client, ClientOptions } from '@elastic/elasticsearch'

const connect = (options: ClientOptions) => async () =>
  options.node ? new Client(options) : null

const drop = async (client: Client) => {
  if (client) await client.indices.delete({ index: 'primary' })
}

const createConnector = (options: ClientOptions) => ({
  connect: connect(options),
  drop,
})

export default createConnector
