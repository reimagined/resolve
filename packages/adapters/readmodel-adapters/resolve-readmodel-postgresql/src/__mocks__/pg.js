const result = []

const Client = jest.fn(function () {
  this.connect = jest.fn(async (...args) => {
    result.push(['connect', ...args])
  })
  this.query = jest.fn(async (...args) => {
    result.push(['query', ...args])
    return { rows: [] }
  })
  this.end = jest.fn(async (...args) => {
    result.push(['end', ...args])
  })
})

export { Client }

export { result }
