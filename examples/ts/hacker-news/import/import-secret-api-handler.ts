let deletingSecret = false

const importSecretApiHandler = () => async (req: any, res: any) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Import API handler should not be used in production mode')
  }

  try {
    const secretRecord = JSON.parse(req.body)

    const secretManager = await req.resolve.eventstoreAdapter.getSecretsManager()

    if (Math.random() > 0.75 && !deletingSecret) {
      deletingSecret = true
      const { secrets } = await req.resolve.eventstoreAdapter.loadSecrets({
        limit: 1,
      })
      if (secrets.length) {
        await secretManager.deleteSecret(secrets[0].id)
      }
      deletingSecret = false
    }

    await secretManager.setSecret(secretRecord.id, secretRecord.secret)

    await res.end('Ok')
  } catch (error) {
    await res.status(500)

    const outError =
      error != null && error.stack != null ? `${error.stack}` : `${error}`

    await res.end(outError)
  }
}

export default importSecretApiHandler
