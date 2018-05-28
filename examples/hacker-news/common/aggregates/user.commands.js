import validate from "./validation";
import { USER_CREATED } from "../events";

export default {
  createUser: (state, command) => {
    validate.stateIsAbsent(state, 'User')
    
    const { name } = command.payload
    
    validate.fieldRequired(command.payload, 'name')
    
    return { type: USER_CREATED, payload: { name } }
  }
}