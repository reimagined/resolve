export const result = []

export const Client = jest.fn()

Client.prototype.connect = jest.fn(() => Promise.resolve())
Client.prototype.query = jest.fn(() => Promise.resolve({ rows: result }))
Client.prototype.end = jest.fn(() => Promise.resolve())
