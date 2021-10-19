import React, { useState } from 'react'

const Aggregates = ({ selected, onClick }) => (
  <g className="box-child-framed box-interactive" data-selected={selected}>
    <a onClick={onClick}>
      <path
        d="M27.095 155.83H60.907V160.33800000000002H27.095z"
        paintOrder="fill markers stroke"
      ></path>
      <text
        x="38.21"
        y="158.624"
        strokeWidth="0.265"
        fontFamily="sans-serif"
        fontSize="2.056"
        letterSpacing="0"
        wordSpacing="0"
        style={{ lineHeight: '1.25' }}
      >
        <tspan x="38.21" y="158.624">
          Aggregates
        </tspan>
      </text>
    </a>
  </g>
)

export default Aggregates
