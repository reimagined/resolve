const handler = async (req, res) => {
  await req.resolve.eventstoreAdapter.setReplicationStatus('notStarted')
  await req.resolve.eventstoreAdapter.setReplicationIterator(null)
  res.status(200)
  res.end()
}

export default handler
