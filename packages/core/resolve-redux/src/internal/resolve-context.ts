import React from 'react'

const { Provider, Consumer } = React.createContext({
  origin: '',
  rootPath: '',
  staticPath: 'static',
})

export { Provider, Consumer }
