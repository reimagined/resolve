const handler = async (req, res) => {
  await req.resolve.eventstoreAdapter.resetReplication()
  res.status(200)
  res.end()
}

export default handler
