const startCreatingApplication = pool => async () => {
  const { console, message } = pool

  console.log(message.startCreatingApp(pool))
}

export default startCreatingApplication
