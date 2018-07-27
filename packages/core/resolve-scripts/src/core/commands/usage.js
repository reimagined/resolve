// eslint-disable-next-line no-console
const println = console.log.bind(console)

const commandList = require('../../configs/command.list.json')

println('Usage: resolve-scripts <command> [options]')
println('')
println('Available commands: ')

for (let cmd of Object.keys(commandList)) {
  println(` ${cmd} - ${commandList[cmd]}`)
}
println('')

process.exit(1)
