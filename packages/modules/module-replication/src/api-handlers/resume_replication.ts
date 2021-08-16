const handler = async (req: any, res: any) => {
  await req.resolve.eventstoreAdapter.setReplicationPaused(false)
  res.status(200)
  res.end()
}

export default handler
