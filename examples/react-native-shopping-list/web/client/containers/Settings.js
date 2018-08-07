import React from 'react'
import { connect } from 'react-redux'

class Settings extends React.PureComponent {
  render() {
    const { jwt } = this.props

    return (
      <div className="example-wrapper">
        Profile
        <div>{JSON.stringify(jwt)}</div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  jwt: state.jwt
})

export default connect(mapStateToProps)(Settings)
