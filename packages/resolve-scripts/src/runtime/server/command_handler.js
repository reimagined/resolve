import println from './utils/println';
import executeCommand from './command_executor';

const message = require('../../../configs/message.json');

const commandHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  try {
    await executeCommand(req.body, req.jwtToken);
    res.status(200).send(message.commandSuccess);
  } catch (err) {
    res.status(500).end(`${message.commandFail}${err.message}`);
    println.error(err);
  }
};

export default commandHandler;
