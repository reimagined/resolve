import { getRootableUrl } from './utils';

const loadInitialState = async (
  { origin, rootPath },
  viewModelName,
  aggregateId
) => {
  const response = await fetch(
    getRootableUrl(
      origin,
      rootPath,
      `/api/query/${viewModelName}?aggregateIds${
        aggregateId === '*' ? '' : '[]'
      }=${aggregateId}`
    ),
    {
      method: 'GET',
      credentials: 'same-origin'
    }
  );

  if (!response.ok) {
    throw new Error(response.text());
  }

  return await response.json();
};

export default loadInitialState;
