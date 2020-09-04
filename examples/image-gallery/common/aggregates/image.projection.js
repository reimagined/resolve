import { IMAGE_CREATED } from '../event-types';

export default {
  Init: () => ({}),
  [IMAGE_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp,
  }),
};
