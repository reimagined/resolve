import React from 'react'

import { Consumer } from '../internal/resolve-context'
import { arrayOfString } from '../helpers'

const defaultContext = { origin: '', rootPath: '', staticPath: 'static' }

const createContextBasedConnector = (getContextBasedUrl: Function): any => (
  propsList: any[]
): any => (Component: any): any => {
  arrayOfString(propsList, 'Props list')

  const propsListSize = propsList.length

  return class ContextBasedComponent extends React.PureComponent<any> {
    functionAsChildComponent = (context: any): any => {
      const { innerRef, ...props } = this.props

      const staticBasedProps: { [key: string]: any } = {}

      for (
        let propertyIndex = 0;
        propertyIndex < propsListSize;
        propertyIndex++
      ) {
        const propertyName = propsList[propertyIndex]
        const propertyValue = props[propertyName]
        if (Array.isArray(propertyValue)) {
          const subProps = []
          const subPropertySize = propertyValue.length
          for (
            let subPropertyIndex = 0;
            subPropertyIndex < subPropertySize;
            subPropertyIndex++
          ) {
            subProps[subPropertyIndex] = getContextBasedUrl(
              context || defaultContext,
              propertyValue[subPropertyIndex]
            )
          }
          staticBasedProps[propertyName] = subProps
        } else {
          staticBasedProps[propertyName] = getContextBasedUrl(
            context || defaultContext,
            propertyValue
          )
        }
      }

      return <Component {...props} {...staticBasedProps} ref={innerRef} />
    }

    render() {
      return <Consumer>{this.functionAsChildComponent}</Consumer>
    }
  }
}

export default createContextBasedConnector
