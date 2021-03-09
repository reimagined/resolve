const promised = (result?: any): Function => jest.fn().mockReturnValue(result)

const sqlite = {
  open: promised({
    exec: promised(),
  }),
  get: promised(),
}

export default sqlite
