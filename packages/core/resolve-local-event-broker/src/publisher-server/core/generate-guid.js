const generateGuid = (...args) => {
  const baseBuffer = Buffer.from(
    `${args.map(String).join('')}${Date.now()}${Math.random()}`
  );
  const resultBuffer = Buffer.alloc(48);
  for (let index = 0; index < baseBuffer.length; index++) {
    resultBuffer[index % 48] = resultBuffer[index % 48] ^ baseBuffer[index];
  }
  let result = resultBuffer.toString('base64');
  result = result.replace(/[+/=]/gi, 'z');
  return result;
};

export default generateGuid;
