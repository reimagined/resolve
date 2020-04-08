import {
  USER_REGISTERED,
  USER_PROFILE_UPDATED,
  USER_PROFILE_DELETED
} from '../user-profile.events'
import { Aggregate } from 'resolve-command'

const aggregate: Aggregate = {
  register: (state, command, context) => {
    const { isRegistered, isDeleted } = state
    if (isRegistered) {
      throw Error(`the user already registered`)
    }
    if (isDeleted) {
      throw Error(`the user was deleted and cannot be registered again`)
    }

    const {
      payload: { nickname, firstName, lastName, phoneNumber, address }
    } = command

    if (!firstName || !lastName || !phoneNumber) {
      throw Error(`some of the user profile data missed`)
    }

    const { encrypt } = context

    return {
      type: USER_REGISTERED,
      payload: {
        nickname,
        firstName: encrypt(firstName),
        lastName: encrypt(lastName),
        contacts: encrypt({
          phoneNumber,
          address
        })
      }
    }
  },
  update: (state, command, context) => {
    const { isRegistered } = state
    if (isRegistered) {
      throw Error(`the user does not exist`)
    }

    const { firstName, lastName } = command.payload
    const { firstName: currentFirstName, lastName: currentLastName } = state

    const { decrypt, encrypt } = context

    if (
      firstName !== decrypt(currentFirstName) ||
      lastName !== decrypt(currentLastName)
    ) {
      return {
        type: USER_PROFILE_UPDATED,
        payload: {
          firstName: encrypt(firstName),
          lastName: encrypt(lastName)
        }
      }
    }

    throw Error("no changes to the user's profile found")
  },
  delete: state => {
    const { isRegistered } = state
    if (isRegistered) {
      throw Error(`the user does not exist`)
    }

    return {
      type: USER_PROFILE_DELETED
    }
  }
}

export default aggregate
