export const result = []

const query = (...args) => {
  result.push(['query', ...args])
  return [[], []]
}

const end = (...args) => result.push(['end', ...args])

const connection = {
  query,
  end
}

const createConnection = () => connection

const MySQL = {
  createConnection
}

export default MySQL
