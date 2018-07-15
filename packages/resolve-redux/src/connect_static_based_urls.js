import React from 'react'

import getStaticBasedUrl from './get_static_based_url'
import { Consumer } from './resolve_context'
import isString from './is_string'

export const isNonString = value => !isString(value)

const connectStaticBasedUrls = propsList => Component =>
  class StaticBasedComponent extends React.PureComponent {
    render() {
      const props = this.props

      if (!Array.isArray(propsList) || propsList.find(isNonString)) {
        // eslint-disable-next-line
        console.error(propsList)
        throw new Error('Props list must be Array<String>')
      }

      return (
        <Consumer>
          {({ origin = '', rootPath = '', staticPath = 'static' } = {}) => {
            const staticBasedProps = {}

            for (const name of propsList) {
              const propValue = props[name]
              if (Array.isArray(propValue)) {
                staticBasedProps[name] = []
                for (let index = 0; index < propValue.length; index++) {
                  staticBasedProps[name][index] = getStaticBasedUrl(
                    origin,
                    rootPath,
                    staticPath,
                    propValue[index]
                  )
                }
              } else {
                staticBasedProps[name] = getStaticBasedUrl(
                  origin,
                  rootPath,
                  staticPath,
                  propValue
                )
              }
            }

            return <Component {...props} {...staticBasedProps} />
          }}
        </Consumer>
      )
    }
  }

export default connectStaticBasedUrls
