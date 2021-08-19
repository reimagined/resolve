import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const Container = styled.div`
  display: inline-block;
`

const TimeAgo = ({ createdAt }: { createdAt: number }) => {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, MINUTE)
    return () => clearInterval(interval)
  }, [])

  const getMessage = useCallback(() => {
    const time = new Date(+createdAt).getTime()

    const difference = now - time

    if (difference / MINUTE < 1) {
      return 'less than a minute ago'
    } else if (difference / HOUR < 1) {
      const minutes = Math.floor(difference / MINUTE)
      return `${minutes} minute(s) ago`
    } else if (difference / DAY < 1) {
      const hours = Math.floor(difference / HOUR)
      return `${hours} hour(s) ago`
    } else {
      const days = Math.floor(difference / DAY)
      return `${days} day(s) ago`
    }
  }, [])

  return <Container>{getMessage()}</Container>
}

export { TimeAgo }
