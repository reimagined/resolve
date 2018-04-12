import jestRunner from '../jest_runner'

const commands = require('../../../configs/command.list.json')

export const command = 'test'
export const desc = commands.test
export const builder = () => {}

export const handler = () => jestRunner()
