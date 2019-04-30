const rewindListener = async ({ meta }, listenerId) => {
  try {
    await meta.rewindListener(listenerId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Rewind listener', error)
  }
}

export default rewindListener
