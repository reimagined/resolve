import {
  CONNECT_READMODEL,
  CONNECT_VIEWMODEL,
  DISCONNECT_READMODEL,
  DISCONNECT_VIEWMODEL,
  DISPATCH_TOPIC_MESSAGE,
  DROP_READMODEL_STATE,
  DROP_VIEWMODEL_STATE,
  HOT_MODULE_REPLACEMENT,
  LOAD_READMODEL_STATE_FAILURE,
  LOAD_READMODEL_STATE_REQUEST,
  LOAD_READMODEL_STATE_SUCCESS,
  LOAD_VIEWMODEL_STATE_FAILURE,
  LOAD_VIEWMODEL_STATE_REQUEST,
  LOAD_VIEWMODEL_STATE_SUCCESS,
  SEND_COMMAND_FAILURE,
  SEND_COMMAND_REQUEST,
  SEND_COMMAND_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  SUBSCRIBE_TOPIC_REQUEST,
  SUBSCRIBE_TOPIC_SUCCESS,
  UNSUBSCRIBE_TOPIC_FAILURE,
  UNSUBSCRIBE_TOPIC_REQUEST,
  UNSUBSCRIBE_TOPIC_SUCCESS,
  AUTH_REQUEST,
  AUTH_SUCCESS,
  AUTH_FAILURE,
  UPDATE_JWT,
  LOGOUT
} from '../src/action_types'

import {
  connectReadModel,
  connectViewModel,
  disconnectReadModel,
  disconnectViewModel,
  dispatchTopicMessage,
  dropReadModelState,
  dropViewModelState,
  hotModuleReplacement,
  loadReadModelStateRequest,
  loadReadModelStateSuccess,
  loadReadModelStateFailure,
  loadViewModelStateRequest,
  loadViewModelStateSuccess,
  loadViewModelStateFailure,
  sendCommandRequest,
  sendCommandSuccess,
  sendCommandFailure,
  subscribeTopicRequest,
  subscribeTopicSuccess,
  subscribeTopicFailure,
  unsubscribeTopicRequest,
  unsubscribeTopicFailure,
  unsubscribeTopicSuccess,
  authRequest,
  authSuccess,
  authFailure,
  updateJwt,
  logout
} from '../src/actions'

describe('actions', () => {
  describe('connectReadModel', () => {
    test('should create an action to connect read model', () => {
      const readModelName = 'items'
      const resolverName = 'getAllItems'
      const resolverArgs = { invert: true }
      expect(
        connectReadModel(readModelName, resolverName, resolverArgs)
      ).toEqual({
        type: CONNECT_READMODEL,
        readModelName,
        resolverName,
        resolverArgs
      })
    })
  })

  describe('connectViewModel', () => {
    test('should create an action to connect view model', () => {
      const viewModelName = 'items'
      const aggregateIds = ['uuid-1', 'uuid-2', 'uuid-3']
      const aggregateArgs = { invert: true }
      expect(
        connectViewModel(viewModelName, aggregateIds, aggregateArgs)
      ).toEqual({
        type: CONNECT_VIEWMODEL,
        viewModelName,
        aggregateIds,
        aggregateArgs
      })
    })
  })

  describe('disconnectReadModel', () => {
    test('should create an action to disconnect read model', () => {
      const readModelName = 'items'
      const resolverName = 'getAllItems'
      const resolverArgs = { invert: true }
      expect(
        disconnectReadModel(readModelName, resolverName, resolverArgs)
      ).toEqual({
        type: DISCONNECT_READMODEL,
        readModelName,
        resolverName,
        resolverArgs
      })
    })
  })

  describe('disconnectViewModel', () => {
    test('should create an action to disconnect view model', () => {
      const viewModelName = 'items'
      const aggregateIds = ['uuid-1', 'uuid-2', 'uuid-3']
      const aggregateArgs = { invert: true }
      expect(
        disconnectViewModel(viewModelName, aggregateIds, aggregateArgs)
      ).toEqual({
        type: DISCONNECT_VIEWMODEL,
        viewModelName,
        aggregateIds,
        aggregateArgs
      })
    })
  })

  describe('dispatchTopicMessage', () => {
    test('should create an action to dispatch mqtt message', () => {
      const message = { payload: {} }
      expect(dispatchTopicMessage(message)).toEqual({
        type: DISPATCH_TOPIC_MESSAGE,
        message
      })
    })
  })

  describe('dropReadModelState', () => {
    test('should create an action to drop read model state', () => {
      const readModelName = 'items'
      const resolverName = 'getAllItems'
      const resolverArgs = { invert: true }
      expect(
        dropReadModelState(readModelName, resolverName, resolverArgs)
      ).toEqual({
        type: DROP_READMODEL_STATE,
        readModelName,
        resolverName,
        resolverArgs
      })
    })
  })

  describe('dropViewModelState', () => {
    test('should create an action to drop view model state', () => {
      const viewModelName = 'items'
      const aggregateIds = ['uuid-1', 'uuid-2', 'uuid-3']
      const aggregateArgs = { invert: true }
      expect(
        dropViewModelState(viewModelName, aggregateIds, aggregateArgs)
      ).toEqual({
        type: DROP_VIEWMODEL_STATE,
        viewModelName,
        aggregateIds,
        aggregateArgs
      })
    })
  })

  describe('hotModuleReplacement', () => {
    test('should create an action to hot module replacement', () => {
      const hotModuleReplacementId = 'hotModuleReplacementId'
      expect(hotModuleReplacement(hotModuleReplacementId)).toEqual({
        type: HOT_MODULE_REPLACEMENT,
        hotModuleReplacementId
      })
    })
  })

  describe('loadReadModelStateRequest', () => {
    test('should create an action to load read model state request', () => {
      const readModelName = 'items'
      const resolverName = 'getAllItems'
      const resolverArgs = {
        invert: true
      }
      const queryId = 'uuid-1'
      expect(
        loadReadModelStateRequest(
          readModelName,
          resolverName,
          resolverArgs,
          queryId
        )
      ).toEqual({
        type: LOAD_READMODEL_STATE_REQUEST,
        readModelName,
        resolverName,
        resolverArgs,
        queryId
      })
    })
  })

  describe('loadReadModelStateSuccess', () => {
    test('should create an action to read view model state success', () => {
      const readModelName = 'items'
      const resolverName = 'getAllItems'
      const resolverArgs = {
        invert: true
      }
      const queryId = 'uuid-1'
      const result = { test: true }
      const timestamp = Date.now()
      expect(
        loadReadModelStateSuccess(
          readModelName,
          resolverName,
          resolverArgs,
          queryId,
          result,
          timestamp
        )
      ).toEqual({
        type: LOAD_READMODEL_STATE_SUCCESS,
        readModelName,
        resolverName,
        resolverArgs,
        queryId,
        result,
        timestamp
      })
    })
  })

  describe('loadReadModelStateFailure', () => {
    test('should create an action to read view model state failure', () => {
      const readModelName = 'items'
      const resolverName = 'getAllItems'
      const resolverArgs = {
        invert: true
      }
      const queryId = 'uuid-1'
      const error = 'error'
      expect(
        loadReadModelStateFailure(
          readModelName,
          resolverName,
          resolverArgs,
          queryId,
          error
        )
      ).toEqual({
        type: LOAD_READMODEL_STATE_FAILURE,
        readModelName,
        resolverName,
        resolverArgs,
        queryId,
        error
      })
    })
  })

  describe('loadViewModelStateRequest', () => {
    test('should create an action to load view model state request', () => {
      const viewModelName = 'items'
      const aggregateIds = ['uuid-1', 'uuid-2', 'uuid-3']
      const aggregateArgs = {
        invert: true
      }
      expect(
        loadViewModelStateRequest(viewModelName, aggregateIds, aggregateArgs)
      ).toEqual({
        type: LOAD_VIEWMODEL_STATE_REQUEST,
        viewModelName,
        aggregateIds,
        aggregateArgs
      })
    })
  })

  describe('loadViewModelStateSuccess', () => {
    test('should create an action to load view model state success', () => {
      const viewModelName = 'items'
      const aggregateIds = ['uuid-1', 'uuid-2', 'uuid-3']
      const aggregateArgs = {
        invert: true
      }
      const result = { test: true }
      const timestamp = Date.now()
      expect(
        loadViewModelStateSuccess(
          viewModelName,
          aggregateIds,
          aggregateArgs,
          result,
          timestamp
        )
      ).toEqual({
        type: LOAD_VIEWMODEL_STATE_SUCCESS,
        viewModelName,
        aggregateIds,
        aggregateArgs,
        result,
        timestamp
      })
    })
  })

  describe('loadViewModelStateFailure', () => {
    test('should create an action to load view model state failure', () => {
      const viewModelName = 'items'
      const aggregateIds = ['uuid-1', 'uuid-2', 'uuid-3']
      const aggregateArgs = {
        invert: true
      }
      const error = 'error'
      expect(
        loadViewModelStateFailure(
          viewModelName,
          aggregateIds,
          aggregateArgs,
          error
        )
      ).toEqual({
        type: LOAD_VIEWMODEL_STATE_FAILURE,
        viewModelName,
        aggregateIds,
        aggregateArgs,
        error
      })
    })
  })

  describe('sendCommandRequest', () => {
    test('should create an action to send command request', () => {
      const commandType = 'createItem'
      const aggregateId = 'aggregateId'
      const aggregateName = 'aggregateName'
      const payload = {
        value: 42
      }
      expect(
        sendCommandRequest(commandType, aggregateId, aggregateName, payload)
      ).toEqual({
        type: SEND_COMMAND_REQUEST,
        commandType,
        aggregateId,
        aggregateName,
        payload
      })
    })
  })

  describe('sendCommandSuccess', () => {
    test('should create an action to send command success', () => {
      const commandType = 'createItem'
      const aggregateId = 'aggregateId'
      const aggregateName = 'aggregateName'
      const payload = {
        value: 42
      }
      expect(
        sendCommandSuccess(commandType, aggregateId, aggregateName, payload)
      ).toEqual({
        type: SEND_COMMAND_SUCCESS,
        commandType,
        aggregateId,
        aggregateName,
        payload
      })
    })
  })

  describe('sendCommandFailure', () => {
    test('should create an action to send command failure', () => {
      const commandType = 'createItem'
      const aggregateId = 'aggregateId'
      const aggregateName = 'aggregateName'
      const payload = {
        value: 42
      }
      const error = 'error'
      expect(
        sendCommandFailure(
          commandType,
          aggregateId,
          aggregateName,
          payload,
          error
        )
      ).toEqual({
        type: SEND_COMMAND_FAILURE,
        commandType,
        aggregateId,
        aggregateName,
        payload,
        error
      })
    })
  })

  describe('subscribeTopicRequest', () => {
    test('should create an action to subscribe topic request', () => {
      const topicName = 'topicName'
      const topicId = 'topicId'
      expect(subscribeTopicRequest(topicName, topicId)).toEqual({
        type: SUBSCRIBE_TOPIC_REQUEST,
        topicName,
        topicId
      })
    })
  })

  describe('subscribeTopicSuccess', () => {
    test('should create an action to subscribe topic success', () => {
      const topicName = 'topicName'
      const topicId = 'topicId'
      expect(subscribeTopicSuccess(topicName, topicId)).toEqual({
        type: SUBSCRIBE_TOPIC_SUCCESS,
        topicName,
        topicId
      })
    })
  })

  describe('subscribeTopicFailure', () => {
    test('should create an action to subscribe topic failure', () => {
      const topicName = 'topicName'
      const topicId = 'topicId'
      const error = 'error'
      expect(subscribeTopicFailure(topicName, topicId, error)).toEqual({
        type: SUBSCRIBE_TOPIC_FAILURE,
        topicName,
        topicId,
        error
      })
    })
  })

  describe('unsubscribeTopicRequest', () => {
    test('should create an action to unsubscribe topic request', () => {
      const topicName = 'topicName'
      const topicId = 'topicId'
      expect(unsubscribeTopicRequest(topicName, topicId)).toEqual({
        type: UNSUBSCRIBE_TOPIC_REQUEST,
        topicName,
        topicId
      })
    })
  })

  describe('unsubscribeTopicSuccess', () => {
    test('should create an action to unsubscribe topic success', () => {
      const topicName = 'topicName'
      const topicId = 'topicId'
      expect(unsubscribeTopicSuccess(topicName, topicId)).toEqual({
        type: UNSUBSCRIBE_TOPIC_SUCCESS,
        topicName,
        topicId
      })
    })
  })

  describe('unsubscribeTopicFailure', () => {
    test('should create an action to unsubscribe topic failure', () => {
      const topicName = 'topicName'
      const topicId = 'topicId'
      const error = 'error'
      expect(unsubscribeTopicFailure(topicName, topicId, error)).toEqual({
        type: UNSUBSCRIBE_TOPIC_FAILURE,
        topicName,
        topicId,
        error
      })
    })
  })

  describe('authRequest', () => {
    test('should create an action to authorization request', () => {
      const url = '/api/auth/local'
      const body = { username: 'username', password: 'password' }
      expect(authRequest(url, body)).toEqual({
        type: AUTH_REQUEST,
        url,
        body
      })
    })
  })

  describe('authSuccess', () => {
    test('should create an action to authorization success', () => {
      const url = '/api/auth/local'
      const body = { username: 'username', password: 'password' }
      expect(authSuccess(url, body)).toEqual({
        type: AUTH_SUCCESS,
        url,
        body
      })
    })
  })

  describe('authFailure', () => {
    test('should create an action to authorization failure', () => {
      const url = '/api/auth/local'
      const body = { username: 'username', password: 'password' }
      const error = 'error'
      expect(authFailure(url, body, error)).toEqual({
        type: AUTH_FAILURE,
        url,
        body,
        error
      })
    })
  })

  describe('updateJwt', () => {
    test('should create an action to update jwt', () => {
      const jwt = { username: 'username', id: 'id' }
      expect(updateJwt(jwt)).toEqual({
        type: UPDATE_JWT,
        jwt
      })
    })
  })

  describe('logout', () => {
    test('should create an action to logout', () => {
      expect(logout()).toEqual({
        type: LOGOUT
      })
    })
  })
})
