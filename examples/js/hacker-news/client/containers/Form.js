import React from 'react'
import { useOriginResolver } from '@resolve-js/react-hooks'
const Form = ({ action, ...props }) => {
  const appHref = useOriginResolver()
  return <form action={appHref(action)} {...props} />
}
export { Form }
