import sinon from 'sinon'
import { expect } from 'chai'

import inMemoryBus from '../src'

describe('inMemoryBus', () => {
  it('publish', () => {
    const busInstance = inMemoryBus()

    const event1 = { type: 'ONE', payload: { data: 'AAA' } }
    const event2 = { type: 'TWO', payload: { data: 'BBB' } }

    const triggerSpy = sinon.spy()
    busInstance.subscribe(triggerSpy)

    busInstance.publish(event1)
    busInstance.publish(event2)

    expect(triggerSpy.callCount).to.be.equal(2)
    expect(triggerSpy.args[0][0]).to.be.deep.equal(event1)
    expect(triggerSpy.args[1][0]).to.be.deep.equal(event2)
  })

  it('publish handles subscription', () => {
    const busInstance = inMemoryBus()
    const event = { type: 'ONE', payload: { data: 'AAA' } }

    const eventHandlerSpy = sinon.spy()
    busInstance.subscribe(eventHandlerSpy)

    busInstance.publish(event)

    expect(eventHandlerSpy.callCount).to.be.equal(1)

    expect(eventHandlerSpy.lastCall.args[0]).to.be.deep.equal(event)
  })
})
