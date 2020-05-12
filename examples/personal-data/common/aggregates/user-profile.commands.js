import {
  USER_REGISTERED,
  USER_PROFILE_UPDATED,
  USER_PROFILE_DELETED,
  USER_PERSONAL_DATA_REQUESTED,
  USER_PERSONAL_DATA_GATHERED
} from '../user-profile.events'
import { systemUserId } from '../constants'

import { decode } from '../jwt'

const aggregate = {
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
    const { decrypt, encrypt, jwt } = context
    const {
      aggregateId,
      payload: { firstName, lastName, phoneNumber, address }
    } = command
    const {
      firstName: currentFirstName,
      lastName: currentLastName,
      contacts: currentContacts
    } = state

    const user = decode(jwt)
    if (user.userId !== aggregateId) {
      throw Error(`you are not authorized to perform this operation`)
    }

    const { isRegistered } = state
    if (!isRegistered) {
      throw Error(`the user does not exist`)
    }

    const {
      phoneNumber: currentPhoneNumber,
      address: currentAddress
    } = decrypt(currentContacts)

    if (
      firstName !== decrypt(currentFirstName) ||
      lastName !== decrypt(currentLastName) ||
      address !== currentAddress ||
      phoneNumber !== currentPhoneNumber
    ) {
      return {
        type: USER_PROFILE_UPDATED,
        payload: {
          firstName: encrypt(firstName),
          lastName: encrypt(lastName),
          contacts: encrypt({
            phoneNumber,
            address
          })
        }
      }
    }

    throw Error("no user's profile changes found")
  },
  delete: (state, { aggregateId }, { jwt }) => {
    const user = decode(jwt)
    if (user.userId !== aggregateId) {
      throw Error(`you are not authorized to perform this operation`)
    }

    const { isRegistered } = state
    if (!isRegistered) {
      throw Error(`the user does not exist`)
    }

    return {
      type: USER_PROFILE_DELETED
    }
  },
  gatherPersonalData: (state, { aggregateId }, { jwt }) => {
    const user = decode(jwt)
    if (user.userId !== aggregateId) {
      throw Error('you are not authorized to perform this operation')
    }

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
  completePersonalDataGathering: (state, command, { jwt }) => {
    const user = decode(jwt)
    if (user.userId !== systemUserId) {
      throw Error('you are not authorized to perform this operation')
    }

    const { isRegistered, personalDataGathering } = state
    if (!isRegistered) {
      throw Error(`the user does not exist`)
    }
    if (personalDataGathering) {
      throw Error(`the user's personal data gathering in process`)
    }

    const { uploadId, token, error } = command.payload

    return {
      type: USER_PERSONAL_DATA_GATHERED,
      payload: {
        uploadId,
        token,
        error
      }
    }
  }
}

export default aggregate
