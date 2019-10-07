const getCommentsOptions = (importProvider, commentsInstanceName) => {
  return importProvider[commentsInstanceName]()
}

export default getCommentsOptions
