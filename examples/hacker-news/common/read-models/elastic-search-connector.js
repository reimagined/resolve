import es from 'elasticsearch'

const connect = (options) => async () => (new es.Client(options))

const drop = async (client) => client.indices.delete({ index: 'primary' })

export default (options) => ({
  connect: connect(options),
  drop
})
