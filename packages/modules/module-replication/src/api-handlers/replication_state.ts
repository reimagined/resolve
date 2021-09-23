import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  const result = await req.resolve.eventstoreAdapter.getReplicationState()
  res.json(result)
}

export default handler
