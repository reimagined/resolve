const decodeXsubContent = encodedContent =>
  Buffer.from(encodedContent, 'base64').toString('utf8')

export default decodeXsubContent
