const handler = async (req, res) => {
  const result = await req.resolve.eventstoreAdapter.getReplicationState()
  res.json(result)
}

export default handler
