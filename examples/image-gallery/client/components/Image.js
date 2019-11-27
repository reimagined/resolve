import React from 'react'

class ImageLogo extends React.Component {
  render() {
    return (
      <div>
        <img src={this.props.src} width='300' />
        <div>{`Index:${this.props.index} name:${this.props.name}`}</div>
      </div>
    )
  }
}

export default ImageLogo
