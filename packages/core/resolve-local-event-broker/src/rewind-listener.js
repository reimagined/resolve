const rewindListener = async ({ database, escapeId, escape }, listenerId) => {
  try {
    await database.exec(`
	    DELETE FROM ${escapeId('Listeners')} WHERE ${escapeId(
      'ListenerId'
    )} = ${escape(listenerId)};
	    COMMIT;
	    BEGIN IMMEDIATE;
    `)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Rewind listener', error)
  }
}

export default rewindListener
