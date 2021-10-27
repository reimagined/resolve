import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  await req.resolve.eventstoreAdapter.resetReplication()
  res.status(200)
  res.end()
}

export default handler
