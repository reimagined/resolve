import { Request, Response } from '../types'

const handler = async (req: Request, res: Response): Promise<void> => {
  try {
    const adapter = req.resolve.eventstoreAdapter
    await adapter.freeze()
    await res.end('OK')
  } catch (error) {
    await res.status(500)
    await res.end(error)
  }
}

export default handler
