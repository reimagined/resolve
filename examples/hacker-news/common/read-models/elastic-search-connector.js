import es from '@elastic/elasticsearch'

const connect = options => async () =>
  options.node ? new es.Client(options) : null

const drop = async client => {
  if (client) await client.indices.delete({ index: 'primary' })
}

export default options => ({
  connect: connect(options),
  drop
})
