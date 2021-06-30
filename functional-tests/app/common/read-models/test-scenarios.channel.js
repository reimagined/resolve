const channel = {
  checkPermissions: (channel, permit) => {
    console.log(`Requested permissions to [${channel}] with "${permit}"`)
    return permit === 'allow'
  },
}

export default channel
