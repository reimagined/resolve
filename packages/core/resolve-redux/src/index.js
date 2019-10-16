import * as actions from './actions'
import * as actionTypes from './action_types'
import createResolveMiddleware from './create_resolve_middleware'
import createViewModelsReducer from './create_view_models_reducer'
import createReadModelsReducer from './create_read_models_reducer'
import createJwtReducer from './create_jwt_reducer'
import connectReadModel from './connect_read_model'
import connectViewModel from './connect_view_model'
import connectResolveAdvanced from './connect_resolve_advanced'
import createApi from './create_api'
import createConnectionManager from './create_connection_manager'
import createSagaManager from './create_saga_manager'
import getHash from './get_hash'
import getRootBasedUrl from './get_root_based_url'
import getStaticBasedUrl from './get_static_based_url'
import connectStaticBasedUrls from './connect_static_based_urls'
import connectRootBasedUrls from './connect_root_based_urls'
import { FetchError, HttpError } from './create_api'
import { Provider, Consumer } from './resolve_context'
import Providers from './providers'
import AppContainer from './app_container'
import Routes from './routes'
import deserializeInitialState from './deserialize_initial_state'
import createStore from './create_store'

const sendAggregateAction = (
  aggregateName,
  commandType,
  aggregateId,
  payload
) =>
  actions.sendCommandRequest(commandType, aggregateId, aggregateName, payload)

export {
  actions,
  actionTypes,
  createViewModelsReducer,
  createReadModelsReducer,
  createJwtReducer,
  createResolveMiddleware,
  sendAggregateAction,
  connectViewModel,
  connectReadModel,
  connectResolveAdvanced,
  connectStaticBasedUrls,
  connectRootBasedUrls,
  createApi,
  createConnectionManager,
  createSagaManager,
  getHash,
  getRootBasedUrl,
  getStaticBasedUrl,
  Provider,
  Consumer,
  FetchError,
  HttpError,
  AppContainer,
  Routes,
  Providers,
  createStore,
  deserializeInitialState
}
