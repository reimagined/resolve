const importJwtCookie = ({ resolveConfig }) => {
  const exports = []

  exports.push(
    `const jwtCookie = ${JSON.stringify(resolveConfig.jwtCookie, null, 2)}`,
    ``,
    `export default jwtCookie`
  )

  return exports.join('\r\n')
}

export default importJwtCookie
