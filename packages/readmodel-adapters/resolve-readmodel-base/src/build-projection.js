const buildProjection = (
  { metaApi, storeApi, internalContext },
  inputProjection
) => {
  return Object.keys(inputProjection).reduce((projection, eventType) => {
    if (
      eventType === 'Init' &&
      typeof inputProjection[eventType] === 'function'
    ) {
      internalContext.initHandler = inputProjection[eventType];
      return projection;
    }

    projection[eventType] = async event => {
      await metaApi.setLastTimestamp(event.timestamp);
      await inputProjection[eventType](storeApi, event);
    };

    return projection;
  }, {});
};

export default buildProjection;
