import React from 'react'
import { useOriginResolver } from '@resolve-js/react-hooks'
const Form = ({ action, ...props }) => {
  const appHref = useOriginResolver()
  return React.createElement('form', { action: appHref(action), ...props })
}
export { Form }
