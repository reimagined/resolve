import styled, { css } from 'styled-components'

const Splitter = styled.div`
  display: inline-block;
  vertical-align: middle;
  margin-left: 0.33em;
  margin-right: 0.33em;
  border-left: 1px solid #666;
  height: 0.83em;

  ${props =>
    props.color &&
    css`
      border-left-color: ${props.color};
    `};
`

export default Splitter
