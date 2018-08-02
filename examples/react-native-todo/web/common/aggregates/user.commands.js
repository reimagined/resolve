export default {
  createUser: (state, command) => {
    if(state.createdAt) {
      throw new Error('User already exists')
    }
    
    const { username, passwordHash, accessTokenHash } = command.payload
    
    if(!username) {
      throw new Error('The "username" field is required')
    }
  
    if(!passwordHash && !accessTokenHash) {
      throw new Error('The "passwordHash" or "accessTokenHash" field is required')
    }
    
    return {
      type: 'USER_CREATED',
      payload: {
        username: username.toLowerCase().trim(),
        passwordHash,
        accessTokenHash
      }
    }
  }
}

