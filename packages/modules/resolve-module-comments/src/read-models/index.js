import path from 'path'

export default (options, imports) => [
  {
    name: options.aggregateName,
    projection: {
      module: path.join(__dirname, './comments.projection.js'),
      options,
      imports
    },
    resolvers: {
      module: path.join(__dirname, './comments.resolvers.js'),
      options,
      imports
    }
  }
]
