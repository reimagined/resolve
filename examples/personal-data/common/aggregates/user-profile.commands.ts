import {
  USER_REGISTERED,
  USER_PROFILE_UPDATED,
  USER_PROFILE_DELETED,
  USER_PERSONAL_DATA_REQUESTED,
  USER_PERSONAL_DATA_GATHERED
} from '../user-profile.events'
import { Aggregate } from 'resolve-core'

const aggregate: Aggregate = {
  register: (state, command, context) => {
    // TODO: check user authorization token

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
    // TODO: check user authorization token
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

    throw Error("no user's profile changes found")
  },
  delete: state => {
    // TODO: check user authorization token
    const { isRegistered } = state
    if (!isRegistered) {
      throw Error(`the user does not exist`)
    }

    return {
      type: USER_PROFILE_DELETED
    }
  },
  gatherPersonalData: (state, command, authToken) => {
    // TODO: check user authorization token
    const { isRegistered, personalDataGathering } = state
    if (!isRegistered) {
      throw Error(`the user does not exist`)
    }
    if (personalDataGathering) {
      throw Error(`the user's personal data gathering in process`)
    }

    return {
      type: USER_PERSONAL_DATA_REQUESTED
    }
  },
  completePersonalDataGathering: (state, command, authToken) => {
    // TODO: called by system saga - check system authorization token
    const { isRegistered, personalDataGathering } = state
    if (!isRegistered) {
      throw Error(`the user does not exist`)
    }
    if (personalDataGathering) {
      throw Error(`the user's personal data gathering in process`)
    }

    const { archiveId } = command.payload

    return {
      type: USER_PERSONAL_DATA_GATHERED,
      payload: {
        archiveId
      }
    }
  }
}

export default aggregate
