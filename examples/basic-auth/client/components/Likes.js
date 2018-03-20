import React from 'react'
import { connect } from 'resolve-redux'
import { bindActionCreators } from 'redux'

const viewModelName = 'Likes'

export const Likes = ({ aggregateId, likes, like }) => (
  <td
    style={{
      textAlign: 'center',
      padding: '10px 0',
      cursor: 'pointer',
      fontSize: '32px'
    }}
    onClick={like.bind(null, aggregateId, {})}
  >
    ❤ {likes.length}
  </td>
)

const mapStateToProps = (state, { aggregateId }) => ({
  viewModelName,
  aggregateId,
  likes: state.viewModels[viewModelName][aggregateId]
})

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Likes)
