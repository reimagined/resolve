const updateListenerInfo = async (
  { database, escapeId, escape, serializedFields },
  listenerId,
  nextValues
) => {
  let prevValues = null
  try {
    prevValues = await database.get(`
      SELECT ${Object.keys(serializedFields)
        .map(escapeId)
        .join(', ')} 
      FROM ${escapeId('Listeners')}
      WHERE ${escapeId('ListenerId')} = ${escape(listenerId)}
    `)
  } catch (error) {
    throw new Error(
      [
        `Local event broken run into error while reading meta information`,
        `If you had upgraded reSolve version, delete "data/local-bus-broker.db" file`,
        `Original error: ${error}`
      ].join('\n')
    )
  }

  if (prevValues != null) {
    for (const fieldName of Object.keys(serializedFields)) {
      prevValues[fieldName] =
        prevValues[fieldName] != null
          ? serializedFields[fieldName].parse(prevValues[fieldName])
          : null
    }
  }

  for (const key of Object.keys(nextValues)) {
    if (nextValues[key] == null) {
      delete nextValues[key]
    }
  }

  const values =
    prevValues != null ? { ...prevValues, ...nextValues } : nextValues

  try {
    await database.exec(`
      REPLACE INTO ${escapeId('Listeners')}(
        ${escapeId('ListenerId')}, ${Object.keys(values)
      .map(escapeId)
      .join(', ')}
      ) VALUES(
        ${escape(listenerId)}, ${Object.keys(values)
      .map(key => serializedFields[key].stringify(values[key]))
      .join(', ')}
      );
      COMMIT;
      BEGIN IMMEDIATE;
    `)
  } catch (error) {
    throw new Error(
      [
        `Local event broken run into error while updating meta information`,
        `If you had upgraded reSolve version, delete "data/local-bus-broker.db" file`,
        `Original error: ${error}`
      ].join('\n')
    )
  }
}

export default updateListenerInfo
