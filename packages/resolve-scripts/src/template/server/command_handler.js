import println from './utils/println'
import message from './constants/message'
import executeCommand from './command_executor'

const commandHandler = async (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }
  try {
    await executeCommand(req.body, req.jwtToken)
    res.status(200).send(message.commandSuccess)
  } catch (err) {
    res.status(500).end(`${message.commandFail}${err.message}`)
    println.error(err)
  }
}

export default commandHandler
