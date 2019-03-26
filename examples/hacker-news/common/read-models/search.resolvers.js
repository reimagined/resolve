const search = async (es, { q }) => {
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

export default {
  search
}
