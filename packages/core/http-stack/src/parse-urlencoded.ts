const parseUrlencoded = (
  body: Buffer | null,
) => {
  if (body != null) {
    const bodyToString = body.toString()

    const bodyFields = bodyToString
      .split('&')
      .reduce<Record<string, string>>((acc, pair) => {
        let [key, value] = pair.split('=').map(decodeURIComponent)
        console.log(key, value)
        acc[key] = value
        return acc
      }, {})

    return bodyFields
  } else return null
}

export default parseUrlencoded
