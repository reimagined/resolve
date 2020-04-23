import * as React from 'react'
import { useStaticResolver } from 'resolve-react-hooks'

const Login = (): any => {
  const asset = useStaticResolver()

  return (
    <div className="h-100 row align-items-center">
      <img src={asset('/loading.gif') as string} alt="loading" />
    </div>
  )
}

export default Login
