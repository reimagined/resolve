const throwBadCursor = (): void => {
  throw new Error('Cursor cannot be used when reading by timestamp boundary')
}

export default throwBadCursor
