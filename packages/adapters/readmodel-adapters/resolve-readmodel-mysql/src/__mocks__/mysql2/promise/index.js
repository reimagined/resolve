export const result = []

const query = (...args) => {
  if (args.length === 1 && args[0] === `SELECT version() AS \`version\``) {
    return [[{ version: '8.0.0' }]]
  }
  result.push(['query', ...args])
  return [[], []]
}

const end = (...args) => result.push(['end', ...args])

const connection = {
  query,
  end,
}

const createConnection = () => connection

const MySQL = {
  createConnection,
}

export default MySQL
