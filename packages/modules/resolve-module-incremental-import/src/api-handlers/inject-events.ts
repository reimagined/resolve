import { Request, Response } from '../types'
import wrapRequest from './wrap-request'

const handler = async (req: Request, res: Response): Promise<void> => {
  const adapter = req.resolve.eventstoreAdapter
  const request = wrapRequest(req)
  const events = request.body

  try {
    const importId = await adapter.beginIncrementalImport()
    await adapter.pushIncrementalImport(events, importId)
    await adapter.commitIncrementalImport(importId)
    await res.end('OK')
  } catch (error) {
    try {
      await adapter.rollbackIncrementalImport()
    } catch (e) {}

    await res.status(500)
    await res.end(error)
  }
}

export default handler
