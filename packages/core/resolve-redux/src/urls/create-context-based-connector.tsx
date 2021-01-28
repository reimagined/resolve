import React from 'react'

import { arrayOfString } from '../helpers'

class PropsResolver extends React.PureComponent<any> {
  render() {
    const {
      innerRef,
      propList,
      TargetComponent,
      resolver,
      ...props
    } = this.props

    const propsListSize = propList.length

    const resolvedProps: { [key: string]: any } = {}

    for (
      let propertyIndex = 0;
      propertyIndex < propsListSize;
      propertyIndex++
    ) {
      const propertyName = propList[propertyIndex]
      const propertyValue = props[propertyName]
      if (Array.isArray(propertyValue)) {
        const subProps = []
        const subPropertySize = propertyValue.length
        for (
          let subPropertyIndex = 0;
          subPropertyIndex < subPropertySize;
          subPropertyIndex++
        ) {
          subProps[subPropertyIndex] = resolver(propertyValue[subPropertyIndex])
        }
        resolvedProps[propertyName] = subProps
      } else {
        resolvedProps[propertyName] = resolver(propertyValue)
      }
    }
    return <TargetComponent {...props} {...resolvedProps} ref={innerRef} />
  }
}

const createContextBasedConnector = (hook: Function): any => (
  propList: any[]
): any => (Component: any): any => {
  arrayOfString(propList, 'Prop list')
  return (props: any) => {
    const resolver = hook()
    return (
      <PropsResolver
        TargetComponent={Component}
        propList={propList}
        resolver={resolver}
        {...props}
      />
    )
  }
}

export default createContextBasedConnector
