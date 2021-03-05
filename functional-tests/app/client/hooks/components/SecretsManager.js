import React, { useState } from 'react'
import { useQuery } from '@resolve-js/react-hooks'

const SecretsManager = () => {
  const [secretValue, setSecretValue] = useState('unknown')

  const assertSecretsManager = useQuery(
    {
      name: 'personal-data',
      resolver: 'assertSecretsManager',
      args: {},
    },
    (error, result) => {
      if (error) {
        return setSecretValue(error.message)
      }
      setSecretValue(result.data.secretValue)
    }
  )

  return (
    <div>
      <h4>{`Assert secrets manager within read model resolver`}</h4>
      <button onClick={assertSecretsManager}>assert</button>
      <div id="secret-value">{secretValue}</div>
    </div>
  )
}

export { SecretsManager }
