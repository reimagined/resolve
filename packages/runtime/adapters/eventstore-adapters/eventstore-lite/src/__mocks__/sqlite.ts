const promised = (result?: any): Function => jest.fn().mockReturnValue(result)

const sqlite = {
  open: promised({
    exec: promised(),
    driver: {
      serialize: jest.fn(),
    },
  }),
  get: promised(),
}

export default sqlite
