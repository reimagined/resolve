import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

import config from './config'

jest.setTimeout(1000 * 60 * 5)

describe('Read-model sample', () => {
  const {
    name,
    resolvers: resolversModule,
    projection: projectionModule,
    connectorName,
  } = config.readModels.find(({ name }) => name === 'Stories')
  const {
    module: connectorModule,
    options: connectorOptions,
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default

  const projection = interopRequireDefault(require(`./${projectionModule}`))
    .default
  const resolvers = interopRequireDefault(require(`./${resolversModule}`))
    .default

  let adapter = null
  beforeEach(async () => {
    adapter = createConnector(connectorOptions)
  })
  afterEach(async () => {
    adapter = null
  })

  const events = [
    {
      aggregateId: 'story-id-1',
      type: 'STORY_CREATED',
      payload: {
        text: 'Text 1.0',
      },
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_CREATED',
      payload: {
        text: 'Text 2.0',
      },
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_CREATED',
      payload: {
        text: 'Text 3.0',
      },
    },
    {
      aggregateId: 'story-id-4',
      type: 'STORY_CREATED',
      payload: {
        text: 'Text 4.0',
      },
    },
    {
      aggregateId: 'story-id-5',
      type: 'STORY_CREATED',
      payload: {
        text: 'Text 5.0',
      },
    },
    {
      aggregateId: 'story-id-1',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 1.1',
      },
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 2.1',
      },
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 2.2',
      },
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 3.1',
      },
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 3.2',
      },
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 3.3',
      },
    },
    {
      aggregateId: 'story-id-5',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 5.1',
      },
    },
    {
      aggregateId: 'story-id-5',
      type: 'STORY_UPDATED',
      payload: {
        text: 'Text 5.2',
      },
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_FLAGGED_FOR_DELETION',
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_FLAGGED_FOR_DELETION',
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_DELETED',
    },
  ]

  test(`resolve "getStoryById" ({ id: 'story-id-1' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoryById', { id: 'story-id-1' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-1' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-2' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoryById', { id: 'story-id-2' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-2' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-3' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoryById', { id: 'story-id-3' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-3' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-4' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoryById', { id: 'story-id-4' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-4' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-5' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoryById', { id: 'story-id-5' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-5' })`)
  })

  test(`resolve "getCountStories" ()`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getCountStories')
    ).toMatchSnapshot(`getCountStories()`)
  })

  test(`resolve "getStoriesByIds" ({ ids: ['story-id-1', 'story-id-2', 'story-id-3', 'story-id-4', 'story-id-5'] })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoriesByIds', {
          ids: [
            'story-id-1',
            'story-id-2',
            'story-id-3',
            'story-id-4',
            'story-id-5',
          ],
        })
    ).toMatchSnapshot(
      `.getStoriesByIds({ ids: ['story-id-1', 'story-id-2', 'story-id-3', 'story-id-4', 'story-id-5'] })`
    )
  })

  test(`resolve "getStoriesByPage" ({ skip: 0, limit: 2, ascending: true })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoriesByPage', { skip: 0, limit: 2, ascending: true })
    ).toMatchSnapshot(
      `.getStoriesByPage({ skip: 0, limit: 2, ascending: true })`
    )
  })

  test(`resolve "getStoriesByPage" ({ skip: 2, limit: 2, ascending: true })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoriesByPage', { skip: 2, limit: 2, ascending: true })
    ).toMatchSnapshot(
      `.getStoriesByPage({ skip: 2, limit: 2, ascending: true })`
    )
  })

  test(`resolve "getStoriesByPage" ({ skip: 0, limit: 2, ascending: false })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoriesByPage', { skip: 0, limit: 2, ascending: false })
    ).toMatchSnapshot(
      `.getStoriesByPage({ skip: 0, limit: 2, ascending: false })`
    )
  })

  test(`resolve "getStoriesByPage" ({ skip: 2, limit: 2, ascending: false })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoriesByPage', { skip: 2, limit: 2, ascending: false })
    ).toMatchSnapshot(
      `.getStoriesByPage({ skip: 2, limit: 2, ascending: false })`
    )
  })

  test(`resolve "getStoriesWithRangedVersion" ({ minVersion: 1, maxVersion: 3, openRange: false })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoriesWithRangedVersion', {
          minVersion: 1,
          maxVersion: 3,
          openRange: false,
        })
    ).toMatchSnapshot(
      `.getStoriesWithRangedVersion({ minVersion: 1, maxVersion: 3, openRange: false })`
    )
  })

  test(`resolve "getStoriesWithRangedVersion" ({ minVersion: 1, maxVersion: 3, openRange: true })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoriesWithRangedVersion', {
          minVersion: 1,
          maxVersion: 3,
          openRange: true,
        })
    ).toMatchSnapshot(
      `.getStoriesWithRangedVersion({ minVersion: 1, maxVersion: 3, openRange: true })`
    )
  })

  test(`resolve "getStoryVersionById" ({ id: 'story-id-1' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name,
          projection,
          resolvers,
        })
        .withAdapter(adapter)
        .query('getStoryVersionById', { id: 'story-id-1' })
    ).toMatchSnapshot(`.getStoryVersionById({ id: 'story-id-1' })`)
  })
})
