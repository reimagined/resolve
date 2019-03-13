import React from 'react'
import styled from 'styled-components'

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const Container = styled.div`
  display: inline-block;
`

class TimeAgo extends React.PureComponent {
  state = { timestamp: Date.now() }

  getMessage = () => {
    const now = Date.now()
    const time = new Date(+this.props.createdAt).getTime()

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
  }

  updateTimestamp = () => {
    this.setState({
      timestamp: Date.now()
    })
  }

  componentDidMount() {
    this.timer = setInterval(this.updateTimestamp, MINUTE)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  render() {
    return <Container>{this.getMessage()}</Container>
  }
}

export default TimeAgo
