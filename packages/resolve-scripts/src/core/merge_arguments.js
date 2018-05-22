const dualValues = [['dev', 'prod']]

const mergeArguments = (argv, defaults) => {
  const result = { ...defaults }

  for (const key of Object.keys(argv)) {
    if (argv[key] != null) {
      result[key] = argv[key]

      for (const radio of dualValues) {
        if (radio.includes(key)) {
          for (const dualKey of radio) {
            if (dualKey === key) continue
            result[dualKey] = !argv[key]
          }
        }
      }
    }
  }

  return result
}

export default mergeArguments
