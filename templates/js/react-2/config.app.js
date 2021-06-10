const appConfig = {
  aggregates: [
    {
      name: 'Note',
      commands: 'common/aggregates/note.commands.js',
      projection: 'common/aggregates/note.projection.js',
    },
  ],
  readModels: [
    {
      name: 'Notes',
      connectorName: 'default',
      projection: 'common/read-models/notes.projection.js',
      resolvers: 'common/read-models/notes.resolvers.js',
    },
  ],
  viewModels: [
    {
      name: 'NoteText',
      projection: 'common/view-models/noteText.projection.js',
    },
  ],
  clientEntries: [
    [
      'client/index.js',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}
export default appConfig
