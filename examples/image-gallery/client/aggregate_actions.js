import { sendAggregateAction } from 'resolve-redux';

export const createImage = sendAggregateAction.bind(
  null,
  'Image',
  'createImage'
);
