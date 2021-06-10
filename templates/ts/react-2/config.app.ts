const appConfig = {
  aggregates: [
    {
      name: 'Note',
      commands: 'common/aggregates/note.commands.ts',
      projection: 'common/aggregates/note.projection.ts',
    },
  ],
  readModels: [
    {
      name: 'Notes',
      connectorName: 'default',
      projection: 'common/read-models/notes.projection.ts',
      resolvers: 'common/read-models/notes.resolvers.ts',
    },
  ],
  viewModels: [
    {
      name: 'NoteText',
      projection: 'common/view-models/noteText.projection.ts',
    },
  ],
  clientEntries: [
    [
      'client/index.tsx',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}

export default appConfig
