import { message } from '../constants'

const importGuardOnlyServer = ({ isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}.guardOnlyServer`)
  }

  return `
    import fs from 'fs'

    const clientHostObject = [() => window, () => self].reduce(
      (acc, recognizer) => {
        try {
          return acc != null ? acc : recognizer()
        } catch(e) {}
      },
      null
    )

    const guard = () => {
      const message = [
        'Server-side chunk has been imported on client and running in browser',
        'It\\'s potentially dangerous since can cause sensitive data leak',
        'If you see this message, stop your application server immediately'
      ].join('\\n')

      try {
        clientHostObject.document.write(message)
      } catch(e) {}

      try {
        clientHostObject.alert(message)
      } catch(e) {}

      try {
        clientHostObject.console.log(message)
      } catch(e) {}

      try {
        clientHostObject.close()
      } catch(e) {}

      throw new Error(message)
    }

    if(clientHostObject != null) {
      clientHostObject.setTimeout(guard, 10)
      guard()
    }

    export default null
  `
}

export default importGuardOnlyServer
