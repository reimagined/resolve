import { throwBadCursor } from 'resolve-eventstore-base';
import createQuery from './create-query';

const loadEventsByTimestamp = async (pool, filter) => {
  const { database, escapeId, eventsTableName, shapeEvent } = pool;

  const resultQueryCondition = createQuery(pool, filter);

  const tableNameAsId = escapeId(eventsTableName);

  const rows = await database.all(
    `SELECT * FROM ${tableNameAsId}
    ${resultQueryCondition}
    ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
    LIMIT 0, ${+filter.limit}`
  );
  const events = [];

  for (const event of rows) {
    events.push(shapeEvent(event));
  }

  return {
    get cursor() {
      return throwBadCursor();
    },
    events,
  };
};

export default loadEventsByTimestamp;
