import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  await req.resolve.eventstoreAdapter.setReplicationPaused(true)
  res.status(200)
  res.end()
}

export default handler
