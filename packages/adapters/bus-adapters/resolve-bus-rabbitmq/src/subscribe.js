const subscribe = ({ handlers }, handler) => {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export default subscribe
