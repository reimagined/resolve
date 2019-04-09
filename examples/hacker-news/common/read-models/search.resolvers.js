const find = async (es, { q }) => {
  if (!es)
    throw new Error(
      'Please, configure Elastic Search options, to make this service available'
    )

  const result = await es.search({
    index: 'primary',
    q
  })

  return result.hits.hits.map(hit => ({
    id: hit._id,
    type: hit._type,
    aggregateId: hit._source.aggregateId,
    text: hit._source.text
  }))
}

const enabled = async es => es !== null

export default {
  find,
  enabled
}
