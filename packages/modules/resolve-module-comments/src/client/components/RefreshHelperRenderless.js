import React from 'react'

class RefreshHelperRenderless extends React.PureComponent {
  static defaultProps = {
    children: () => null
  }

  state = {}

  refresh = () => this.setState({ refreshId: Date.now() + Math.random() })

  render() {
    const Component = this.props.children

    return <Component refreshId={this.state.refreshId} refresh={this.refresh} />
  }
}

export default RefreshHelperRenderless
