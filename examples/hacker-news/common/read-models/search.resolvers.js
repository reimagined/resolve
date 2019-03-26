import es from './es'

const find = async (store, { q }) => {
  const result = await es.search({
    q
  })
  return result.hits.hits.map(hit => ({
    index: hit._index,
    aggregateId: hit._id,
    aggregate: hit._source.object,
    text: hit._source.text
  }))
}

export default {
  find
}
