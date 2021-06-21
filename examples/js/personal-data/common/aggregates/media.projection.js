import {
  MEDIA_UPLOAD_STARTED,
  MEDIA_UPLOAD_COMPLETED,
  MEDIA_UPLOAD_FAILED,
} from '../media.events'
const projection = {
  Init: () => ({
    status: 'none',
    isFinished: false,
  }),
  [MEDIA_UPLOAD_STARTED]: (state) => ({
    ...state,
    status: 'started',
  }),
  [MEDIA_UPLOAD_COMPLETED]: (state) => ({
    ...state,
    status: 'finished',
  }),
  [MEDIA_UPLOAD_FAILED]: (state) => ({
    ...state,
    status: 'finished',
  }),
}
export default projection
