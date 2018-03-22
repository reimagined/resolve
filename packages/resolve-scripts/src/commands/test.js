import { commands } from '../configs/strings'
import jestRunner from '../utils/jest_runner'

export const command = 'test'
export const desc = commands.test
export const builder = () => {}

export const handler = () => jestRunner()
