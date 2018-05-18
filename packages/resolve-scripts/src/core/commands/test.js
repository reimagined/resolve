import { commands } from '../constants'
import jestRunner from '../jest_runner'

export const command = 'test'
export const desc = commands.test
export const builder = () => {}

export const handler = () => jestRunner()
