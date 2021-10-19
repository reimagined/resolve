const resolvers = {
  failResolver: async () => {
    throw Error('Test read model: failResolver failure')
  },
}
export default resolvers
