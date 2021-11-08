import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  await req.resolve.eventstoreAdapter.setReplicationLock(0)
  res.status(200)
  res.end()
}

export default handler
