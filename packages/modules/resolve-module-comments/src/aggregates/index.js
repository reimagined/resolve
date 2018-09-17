import path from 'path'

export default (options, imports) => [
  {
    name: options.aggregateName,
    commands: {
      module: path.join(__dirname, './comment.commands.js'),
      options,
      imports
    },
    projection: {
      module: path.join(__dirname, './comment.projection.js'),
      options,
      imports
    }
  }
]
