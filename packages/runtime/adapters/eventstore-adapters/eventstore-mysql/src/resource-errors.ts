import {
  ER_DUP_ENTRY,
  ER_LOCK_DEADLOCK,
  ER_NO_SUCH_TABLE,
  ER_SUBQUERY_NO_1_ROW,
  ER_TABLE_EXISTS,
} from './constants'

export function isAlreadyExistsError(error: any): boolean {
  const errno = Number(error.errno)
  switch (errno) {
    case ER_TABLE_EXISTS:
    case ER_NO_SUCH_TABLE:
    case ER_DUP_ENTRY:
    case ER_LOCK_DEADLOCK:
    case ER_SUBQUERY_NO_1_ROW:
      return true
    default:
      return false
  }
}

export function isNotExistError(error: any): boolean {
  return /Unknown (?:Table|Index)/i.test(error.message)
}
