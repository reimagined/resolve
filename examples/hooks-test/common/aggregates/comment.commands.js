import { COMMENT_CREATED, COMMENT_CONFLICTED } from '../comment_events'

const assert = (payload, name) => {
  if (!payload[name]) {
    throw Error(`"${name}" required`)
  }
}

const HttpError = (code, message) => {
  const error = Error(message)
  error.code = code
  return error
}

export default {
  create: ({ isExist }, { payload }) => {
    if (isExist) {
      throw HttpError(409, 'the comment already exists')
    }

    assert(payload, 'target')
    assert(payload, 'targetId')
    assert(payload, 'text')

    const { target, targetId, parentId, text } = payload

    return {
      type: COMMENT_CREATED,
      payload: {
        target,
        targetId,
        text,
        parentId
      }
    }
  },
  testConflict: () => {
    throw new Error('conflict')
  }
}
