const useYarn = () => {
  return (
    (process.env.npm_execpath && process.env.npm_execpath.includes('yarn')) ||
    (process.env.npm_config_user_agent &&
      process.env.npm_config_user_agent.includes('yarn'))
  )
}

export default useYarn
