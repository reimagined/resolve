import React from 'react'
import uuid from 'uuid'
import { connect } from 'react-redux'
import { connectResolveAdvanced } from 'resolve-redux'
import { Redirect } from 'react-router'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'

const labelWidth = '30px'

const FormLabel = styled.div`
  display: block;
  padding-bottom: 3px;
`

const SubmitButton = styled.button`
  margin-left: ${labelWidth};
  margin-top: 1em;
`

export class Submit extends React.PureComponent {
  state = {
    title: '',
    link: '',
    text: ''
  }

  handleChange = (event, name) => this.setState({ [name]: event.target.value })

  handleSubmit = () => {
    const { title, link, text } = this.state

    return this.props.createStory({
      id: uuid.v4(),
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
          <FormLabel>Title:</FormLabel>
          <input
            type="text"
            value={this.state.title}
            onChange={e => this.handleChange(e, 'title')}
          />
        </div>
        <div>
          <FormLabel>Url:</FormLabel>
          <input
            type="text"
            value={this.state.link}
            onChange={e => this.handleChange(e, 'link')}
          />
        </div>
        <div>
          <FormLabel>Text:</FormLabel>
          <textarea
            name="text"
            rows="4"
            value={this.state.text}
            onChange={e => this.handleChange(e, 'text')}
          />
        </div>
        <div>
        <SubmitButton onClick={this.handleSubmit}>submit</SubmitButton>
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

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      createStory: ({ id, title, text, link }) =>
        aggregateActions.createStory(id, {
          title,
          text,
          link
        })
    },
    dispatch
  )

export default connectResolveAdvanced(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Submit)
)
