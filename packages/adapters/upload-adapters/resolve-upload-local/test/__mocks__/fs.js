const fs = {
  statSync: jest.fn(() => {
    return { size: 0 }
  }),
  createReadStream: jest.fn()
}

export default fs
