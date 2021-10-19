import React, { useState } from 'react'
const WriteSide = ({ selected, onClick }) => (
  <g
    id="interactscm-writeside"
    className="box-solid box-interactive"
    data-selected={selected}
  >
    <a onClick={onClick}>
      <path
        d="M26.458 148.53H61.696999999999996V161.1H26.458z"
        paintOrder="fill markers stroke"
      ></path>
      <text
        x="35.769"
        y="153.491"
        strokeWidth="0.265"
        fontFamily="sans-serif"
        fontSize="3.257"
        letterSpacing="0"
        wordSpacing="0"
        style={{ lineHeight: '1.25' }}
      >
        <tspan x="35.769" y="153.491">
          Write Side
        </tspan>
      </text>
    </a>
  </g>
)

export default WriteSide
