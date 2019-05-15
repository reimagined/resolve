const handlePropertyAction = async (
  pool,
  { listenerId, key, value, action }
) => {
  if (
    (key != null && key.constructor !== String) ||
    (value != null && value.constructor !== String)
  ) {
    throw new Error(`Properties key/values should be strings: ${key}/${value}`)
  }

  const information = await pool.meta.getListenerInfo(listenerId)

  const properties =
    information != null && information.Properties != null
      ? information.Properties
      : {}

  if (!properties.hasOwnProperty('RESOLVE_SIDE_EFFECTS_START_TIMESTAMP')) {
    properties['RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'] = 0
  }

  switch (action) {
    case 'listProperties':
      return properties

    case 'getProperty':
      return properties[key]

    case 'setProperty':
      properties[key] = value
      await pool.meta.updateListenerInfo(listenerId, { Properties: properties })
      return 'ok'

    case 'deleteProperty':
      delete properties[key]
      await pool.meta.updateListenerInfo(listenerId, { Properties: properties })
      return 'ok'

    default:
      throw new Error(`Wrong property action: ${action}`)
  }
}

export default handlePropertyAction
