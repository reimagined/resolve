import type { ResolveRequest, ResolveResponse } from '@resolve-js/core'
import respondWithError from './respond-with-error'

const handler = async (req: ResolveRequest, res: ResolveResponse) => {
  try {
    await req.resolve.eventstoreAdapter.setReplicationPaused(true)
    res.status(200)
    res.end()
  } catch (error) {
    respondWithError('pause', res, error)
  }
}

export default handler
