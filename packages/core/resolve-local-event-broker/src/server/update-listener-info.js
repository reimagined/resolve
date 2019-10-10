const updateListenerInfo = async (
  { database, escapeId, escape, serializedFields },
  listenerId,
  nextValues
) => {
  const prevValues = await database.get(`
    SELECT ${Object.keys(serializedFields)
      .map(escapeId)
      .join(', ')} 
    FROM ${escapeId('Listeners')}
    WHERE ${escapeId('ListenerId')} = ${escape(listenerId)}
  `)

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
}

export default updateListenerInfo
