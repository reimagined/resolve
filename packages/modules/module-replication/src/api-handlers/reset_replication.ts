const handler = async (req: any, res: any) => {
  await req.resolve.eventstoreAdapter.resetReplication()
  res.status(200)
  res.end()
}

export default handler
