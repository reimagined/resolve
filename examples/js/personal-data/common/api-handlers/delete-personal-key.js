const deletePersonalKey = async (req, res) => {
  const secretsManager = await req.resolve.eventstoreAdapter.getSecretsManager()
  const { userId } = req.matchedParams
  try {
    await secretsManager.deleteSecret(userId)
    res.status(200)
    res.end()
  } catch (e) {
    await res.status(405)
    await res.end(e)
  }
}
export default deletePersonalKey
