import React from 'react'
import renderer from 'react-test-renderer'
import { ResolveContext } from '../src/context'
import { ResolveProvider } from '../src/resolve-provider'
import { Context } from '@resolve-js/client'

test('context passed to children', () => {
  const customContext: Context = {
    origin: 'origin',
    staticPath: 'static-path',
    rootPath: 'root-path',
    viewModels: [
      {
        name: 'model',
        projection: { Init: () => null },
        deserializeState: () => ({}),
      },
    ],
  }

  const render = renderer.create(
    <ResolveProvider context={customContext}>
      <ResolveContext.Consumer>
        {({ origin, staticPath, rootPath, viewModels }: any) => (
          <div>
            <p className="origin">{origin}</p>
            <p className="staticPath">{staticPath}</p>
            <p className="rootPath">{rootPath}</p>
            <p className="viewModels">
              {viewModels.map((model: any) => model.name).join(',')}
            </p>
          </div>
        )}
      </ResolveContext.Consumer>
    </ResolveProvider>
  )

  const testInstance = render.root

  expect(testInstance.findByProps({ className: 'origin' }).children).toEqual([
    'origin',
  ])
  expect(
    testInstance.findByProps({ className: 'staticPath' }).children
  ).toEqual(['static-path'])
  expect(testInstance.findByProps({ className: 'rootPath' }).children).toEqual([
    'root-path',
  ])
  expect(
    testInstance.findByProps({ className: 'viewModels' }).children
  ).toEqual(['model'])
})
