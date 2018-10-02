import sinon from 'sinon'

import createAdapter from '../src'

describe('inMemoryBus', () => {
  it('publish', async () => {
    const busInstance = createAdapter()

    const event1 = { type: 'ONE', payload: { data: 'AAA' } }
    const event2 = { type: 'TWO', payload: { data: 'BBB' } }

    const triggerSpy = sinon.spy()
    await busInstance.subscribe(triggerSpy)

    await busInstance.publish(event1)
    await busInstance.publish(event2)

    expect(triggerSpy.callCount).toEqual(2)
    expect(triggerSpy.args[0][0]).toEqual(event1)
    expect(triggerSpy.args[1][0]).toEqual(event2)
  })

  it('publish handles subscription', async () => {
    const busInstance = createAdapter()
    const event = { type: 'ONE', payload: { data: 'AAA' } }

    const eventHandlerSpy = sinon.spy()
    await busInstance.subscribe(eventHandlerSpy)

    await busInstance.publish(event)

    expect(eventHandlerSpy.callCount).toEqual(1)
    expect(eventHandlerSpy.lastCall.args[0]).toEqual(event)
  })
})
