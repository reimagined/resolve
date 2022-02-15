import { IncomingMessage } from 'http'

const isValidRequest = (req: any): req is IncomingMessage =>
  req instanceof IncomingMessage

export default isValidRequest
