import getNativeChunk from '../native-chunk';
const { customConstants } = getNativeChunk();

const origin = `${customConstants.backend.protocol}://${customConstants.backend.hostname}:${customConstants.backend.port}`;

export default origin;
