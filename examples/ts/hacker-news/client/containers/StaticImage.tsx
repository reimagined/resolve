import React from 'react'
import { useStaticResolver } from '@resolve-js/react-hooks'

const StaticImage = ({
  src,
  ...props
}: {
  src: string
  [key: string]: any
}) => {
  const asset = useStaticResolver()
  return <img src={asset(src)} {...props} alt="" />
}

export { StaticImage }
