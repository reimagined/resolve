import React from 'react'
import uuid from 'uuid'
import { connect } from 'react-redux'
import { connectResolveAdvanced } from 'resolve-redux'
import { Redirect } from 'react-router'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'

import * as aggregateActions from '../actions/aggregate-actions'

const FormLabel = styled.div`
  margin-bottom: 0.1em;
`

const FormInput = styled.input`
  margin-bottom: 1em;
`

const FormTextArea = styled.textarea`
  margin-bottom: 1em;
`

const SubmitButton = styled.button`
  margin-bottom: 1em;
`

export class Submit extends React.PureComponent {
  state = {
    title: '',
    link: '',
    text: '',
    disabled: false
  }

  handleChange = (event, name) => this.setState({ [name]: event.target.value })

  handleSubmit = () => {
    const { title, link, text } = this.state

    this.setState({ disabled: !this.state.disabled })

    return this.props.createStory(uuid.v4(), {
      title,
      text,
      link
    })
  }

  render() {
    if (!this.props.me.id) {
      return <Redirect to="/login?redirect=/submit" />
    }

    return (
      <div>
        <div>
          <FormLabel>title:</FormLabel>
          <FormInput
            type="text"
            value={this.state.title}
            onChange={e => this.handleChange(e, 'title')}
            disabled={this.state.disabled}
          />
        </div>
        <div>
          <FormLabel>url:</FormLabel>
          <FormInput
            type="text"
            value={this.state.link}
            onChange={e => this.handleChange(e, 'link')}
            disabled={this.state.disabled}
          />
        </div>
        <div>
          <FormLabel>text:</FormLabel>
          <FormTextArea
            name="text"
            rows="4"
            value={this.state.text}
            onChange={e => this.handleChange(e, 'text')}
            disabled={this.state.disabled}
          />
        </div>
        <div>
          <SubmitButton
            disabled={this.state.disabled}
            onClick={this.handleSubmit}
          >
            {this.state.disabled ? 'Please wait...' : 'submit'}
          </SubmitButton>
        </div>
        <div>
          Leave url blank to submit a question for discussion. If there is no
          url, the text (if any) will appear at the top of the thread.
        </div>
      </div>
    )
  }
}

export const mapStateToProps = state => ({
  me: state.jwt
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectResolveAdvanced(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Submit)
)
