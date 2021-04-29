const checkInput = (input) => {
  if (!Array.isArray(input.events)) {
    throw new Error('Events must be array')
  }
  if (!Array.isArray(input.secretsToSet)) {
    throw new Error('Secrets to set must be array')
  }
  if (!Array.isArray(input.secretsToDelete)) {
    throw new Error('Secrets to delete must be array')
  }
  if (input.iterator == null) {
    throw new Error('Iterator must be non-null object')
  }
}

const handler = async (req, res) => {
  let input
  try {
    input = JSON.parse(req.body)
    checkInput(input)
  } catch (error) {
    res.status(400)
    res.end(error.message)
    return
  }

  try {
    await req.resolve.eventstoreAdapter.setReplicationStatus('batchInProgress')
    await req.resolve.eventstoreAdapter.setReplicationIterator(input.iterator)
  } catch (error) {
    if (error.name === 'ReplicationAlreadyInProgress') {
      res.status(425)
      res.end(error.message)
    } else {
      try {
        await req.resolve.eventstoreAdapter.setReplicationStatus('error', error)
      } catch (e) {}

      res.status(500)
      res.end(error.message)
    }
    return
  }

  res.status(202)
  res.end('Replication has been started')

  try {
    await req.resolve.eventstoreAdapter.replicateSecrets(
      input.secretsToSet,
      input.secretsToDelete
    )
    await req.resolve.eventstoreAdapter.replicateEvents(input.events)
    await req.resolve.eventstoreAdapter.setReplicationStatus(
      'batchDone',
      {
        appliedEventsCount: input.events.length,
      },
      input.events[input.events.length - 1]
    )
  } catch (error) {
    try {
      await req.resolve.eventstoreAdapter.setReplicationStatus('error', error)
    } catch (e) {}
  }
  await req.resolve.notifyEventSubscribers()
}

export default handler
