const saveEventOnly = async function(pool, event) {
  // TODO: split saveEvent and saveEventOnly
  return await pool.saveEvent(event)
}

export default saveEventOnly
