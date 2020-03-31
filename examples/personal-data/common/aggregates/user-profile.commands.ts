import { USER_REGISTERED } from '../user-profile.events'

// TEMP
type CipherBlob = string
type EncryptCallback = (data: any) => CipherBlob
type EncryptionFactory = (keyId: string) => EncryptCallback
type CommandContext = {
  jwt: object
  getEncryption: EncryptionFactory
}
// TEMP

export default {
  register: (state, command, context: CommandContext): any => {
    const { isRegistered } = state
    if (isRegistered) {
      throw Error(`user already registered`)
    }

    const {
      aggregateId,
      payload: { firstName, lastName, phoneNumber, address, creditCard }
    } = command

    if (!firstName || !lastName || !phoneNumber) {
      throw Error(`the user profile not complete`)
    }

    const encrypt = context.getEncryption(aggregateId)

    return {
      type: USER_REGISTERED,
      payload: {
        firstName: encrypt(firstName),
        lastName: encrypt(lastName),
        contacts: encrypt({
          phoneNumber,
          address
        }),
        billing: encrypt({
          creditCard: encrypt(creditCard)
        }),
        simpleField: 'simple',
        otherData: {
          notEncrypted: 'not-encrypted'
        }
      }
    }
  }
}
