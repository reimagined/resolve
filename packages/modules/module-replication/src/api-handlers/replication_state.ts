const handler = async (req: any, res: any) => {
  const result = await req.resolve.eventstoreAdapter.getReplicationState()
  res.json(result)
}

export default handler
