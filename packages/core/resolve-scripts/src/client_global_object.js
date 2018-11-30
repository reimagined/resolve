const getClientGlobalEnvObject = key => `((() => {
    const globalObject = [() => window, () => global, () => self].reduce(
      (acc, recognizer) => {
        try {
          return acc != null ? acc : recognizer()
        } catch(e) {}
      },
      null
    )
    
    if (globalObject == null) {
      throw new Error('Client global object recognition failed')
    }

    if(${JSON.stringify(key == null || key.constructor !== String)}) {
      return globalObject
    }

    const key = ${JSON.stringify(key)}
    if(globalObject[key] == null) {
      throw new Error(\`Client global key \${key} object recognition failed\`)
    }
  
    return globalObject[key]
  })())`

export default getClientGlobalEnvObject
