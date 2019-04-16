import givenEvents from 'resolve-testing-tools'
import createReadModelAdapter from 'resolve-readmodel-lite'

import projection from './projection'
import resolvers from './resolvers'

describe('Read-model sample', () => {
  let adapter = null
  beforeEach(() => {
    adapter = createReadModelAdapter({
      databaseFile: ':memory:'
    })
  })
  afterEach(() => {
    adapter = null
  })

  const events = [
    {
      aggregateId: 'story-id-1',
      type: 'STORY_CREATED',
      payload: 'Text 1.0'
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_CREATED',
      payload: 'Text 2.0'
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_CREATED',
      payload: 'Text 3.0'
    },
    {
      aggregateId: 'story-id-4',
      type: 'STORY_CREATED',
      payload: 'Text 4.0'
    },
    {
      aggregateId: 'story-id-5',
      type: 'STORY_CREATED',
      payload: 'Text 5.0'
    },
    {
      aggregateId: 'story-id-1',
      type: 'STORY_UPDATED',
      payload: 'Text 1.1'
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_UPDATED',
      payload: 'Text 2.1'
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_UPDATED',
      payload: 'Text 2.2'
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_UPDATED',
      payload: 'Text 3.1'
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_UPDATED',
      payload: 'Text 3.2'
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_UPDATED',
      payload: 'Text 3.3'
    },
    {
      aggregateId: 'story-id-5',
      type: 'STORY_UPDATED',
      payload: 'Text 5.1'
    },
    {
      aggregateId: 'story-id-5',
      type: 'STORY_UPDATED',
      payload: 'Text 5.2'
    },
    {
      aggregateId: 'story-id-2',
      type: 'STORY_FLAGGED_FOR_DELETION'
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_FLAGGED_FOR_DELETION'
    },
    {
      aggregateId: 'story-id-3',
      type: 'STORY_DELETED'
    }
  ]

  test(`resolve "getStoryById" ({ id: 'story-id-1' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name: 'Stories',
          projection,
          resolvers,
          adapter
        })
        .getStoryById({ id: 'story-id-1' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-1' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-2' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name: 'Stories',
          projection,
          resolvers,
          adapter
        })
        .getStoryById({ id: 'story-id-2' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-2' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-3' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name: 'Stories',
          projection,
          resolvers,
          adapter
        })
        .getStoryById({ id: 'story-id-3' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-3' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-4' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name: 'Stories',
          projection,
          resolvers,
          adapter
        })
        .getStoryById({ id: 'story-id-4' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-4' })`)
  })

  test(`resolve "getStoryById" ({ id: 'story-id-5' })`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name: 'Stories',
          projection,
          resolvers,
          adapter
        })
        .getStoryById({ id: 'story-id-5' })
    ).toMatchSnapshot(`getStoryById({ id: 'story-id-5' })`)
  })

  test(`resolve "getCountStories" ()`, async () => {
    expect(
      await givenEvents(events)
        .readModel({
          name: 'Stories',
          projection,
          resolvers,
          adapter
        })
        .getCountStories()
    ).toMatchSnapshot(`getCountStories()`)
  })
})
