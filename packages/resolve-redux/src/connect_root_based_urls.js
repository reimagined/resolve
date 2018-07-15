import React from 'react'

import getRootBasedUrl from './get_root_based_url'
import { Consumer } from './resolve_context'
import isString from './is_string'

export const isNonString = value => !isString(value)

const connectRootBasedUrls = propsList => Component =>
  class RootBasedComponent extends React.PureComponent {
    render() {
      const props = this.props

      if (!Array.isArray(propsList) || propsList.find(isNonString)) {
        // eslint-disable-next-line
        console.error(propsList)
        throw new Error('Props list must be Array<String>')
      }

      return (
        <Consumer>
          {({ origin = '', rootPath = '' } = {}) => {
            const staticBasedProps = {}

            for (const name of propsList) {
              const propValue = props[name]
              if (Array.isArray(propValue)) {
                staticBasedProps[name] = []
                for (let index = 0; index < propValue.length; index++) {
                  staticBasedProps[name][index] = getRootBasedUrl(
                    origin,
                    rootPath,
                    propValue[index]
                  )
                }
              } else {
                staticBasedProps[name] = getRootBasedUrl(
                  origin,
                  rootPath,
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

export default connectRootBasedUrls
