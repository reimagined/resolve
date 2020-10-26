const defaultEventTypes = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LIKED: 'USER_LIKED',

  COUNTER_INCREASED: 'COUNTER_INCREASED',
  COUNTER_DECREASED: 'COUNTER_DECREASED',
}

const getEventTypes = (options) => {
  let version = ''
  try {
    const maybeVersion = options.VERSION
    if (maybeVersion.constructor === String) {
      version = maybeVersion
    }
  } catch (e) {}

  const result = {}
  for (const key of Object.keys(defaultEventTypes)) {
    result[key] = `${defaultEventTypes[key]}${version}`
  }

  return result
}

export default getEventTypes
