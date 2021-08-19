const getPersonalKey = async (req: any, res: any) => {
  const secretsManager = await req.resolve.eventstoreAdapter.getSecretsManager()

  const { userId } = req.matchedParams

  try {
    const key = await secretsManager.getSecret(userId)
    res.status(200)
    res.end(key)
  } catch (e) {
    await res.status(405)
    await res.end(e)
  }
}

export default getPersonalKey
