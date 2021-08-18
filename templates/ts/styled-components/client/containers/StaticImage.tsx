import React from 'react'
import { Image } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'

const StaticImage = ({
  src,
  ...otherProps
}: {
  src: string
  [key: string]: any
}) => {
  const resolveStatic = useStaticResolver()
  return <Image {...otherProps} src={resolveStatic(src)} />
}

export { StaticImage }
