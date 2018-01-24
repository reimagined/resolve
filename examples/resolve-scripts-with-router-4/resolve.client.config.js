import React from 'react'
import RootComponent from './index'
import { BrowserRouter } from 'react-router-dom'

export default {
  rootComponent: () => (
    <BrowserRouter>
      <RootComponent />
    </BrowserRouter>
  )
}
