const handler = async (req, res) => {
  await req.resolve.eventstoreAdapter.setReplicationPaused(false)
  res.status(200)
  res.end()
}

export default handler
