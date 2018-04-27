import { expect } from 'chai'
import {
  SUBSCRIBE_VIEWMODEL,
  UNSUBSCRIBE_VIEWMODEL,
  SEND_COMMAND,
  DISCONNECT,
  MERGE
} from '../src/action_types'
import actions from '../src/actions'

describe('actions', () => {
  describe('merge', () => {
    it('should create an action to merge reducer state with viewModel state', () => {
      const aggregateId = 'aggregateId'
      const viewModelName = 'counter'
      const state = {
        value: 10
      }
      expect(actions.merge(viewModelName, aggregateId, state)).to.deep.equal({
        type: MERGE,
        aggregateId,
        viewModelName,
        state
      })
    })
  })

  describe('sendCommand', () => {
    it('should create an action to send command', () => {
      const command = {
        name: 'create'
      }
      const aggregateId = 'aggregateId'
      const aggregateName = 'aggregateName'
      const payload = {
        value: 42
      }
      expect(
        actions.sendCommand({
          command,
          aggregateId,
          aggregateName,
          payload
        })
      ).to.deep.equal({
        type: SEND_COMMAND,
        command,
        aggregateId,
        aggregateName,
        payload
      })
    })
  })

  describe('subscribeViewModel', () => {
    it('should create an action to subscribe on view model by aggregateId', () => {
      const viewModelName = 'counter'
      const aggregateId = 'aggregateId'
      expect(
        actions.subscribeViewModel(viewModelName, aggregateId)
      ).to.deep.equal({
        type: SUBSCRIBE_VIEWMODEL,
        viewModelName,
        aggregateId
      })
    })
  })

  describe('unsubscribeViewModel', () => {
    it('should create an action to unsubscribe on view model by aggregateId', () => {
      const viewModelName = 'counter'
      const aggregateId = 'aggregateId'
      expect(
        actions.unsubscribeViewModel(viewModelName, aggregateId)
      ).to.deep.equal({
        type: UNSUBSCRIBE_VIEWMODEL,
        viewModelName,
        aggregateId
      })
    })
  })

  describe('disconnect', () => {
    it('should create an action to disconnect subscribe adapter', () => {
      const reason = 'reason'
      expect(actions.disconnect(reason)).to.deep.equal({
        type: DISCONNECT,
        reason
      })
    })
  })
})
