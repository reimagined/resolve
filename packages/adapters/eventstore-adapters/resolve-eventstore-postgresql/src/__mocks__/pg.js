const result = []

const Client = jest.fn(function () {
  this.connect = jest.fn(() => Promise.resolve())
  this.query = jest.fn(() => Promise.resolve({ rows: result }))
  this.end = jest.fn(() => Promise.resolve())
})

export { Client }

export { result }
