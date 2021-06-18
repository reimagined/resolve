import { ReadModelResolvers } from '@resolve-js/core'
import { Client } from '@elastic/elasticsearch'

const find = async (es, { q }: { q: string }) => {
  if (!es)
    throw new Error(
      'Please, configure Elastic Search options, to make this service available'
    )

  const result = await es.search({
    index: 'primary',
    q,
  })

  return result.body.hits.hits.map((hit) => ({
    id: hit._id,
    type: hit._source.type,
    aggregateId: hit._source.aggregateId,
    text: hit._source.text,
  }))
}

const enabled = async (es) => es !== null

const searchResolvers: ReadModelResolvers<Client> = {
  find,
  enabled,
}

export default searchResolvers
