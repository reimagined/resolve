import React, { useState } from 'react'

const Client = ({ selected, onClick }) => (
  <g
    id="interactscm-client"
    className="box-framed box-interactive"
    data-selected={selected}
  >
    <a onClick={onClick}>
      <path
        strokeLinejoin="round"
        strokeWidth="0.5"
        d="M70.903 152.15H82.887V194.938H70.903z"
        paintOrder="fill markers stroke"
      ></path>
      <text
        x="71.818"
        y="173.186"
        fill="#3949ab"
        strokeWidth="0.087"
        fontFamily="sans-serif"
        fontSize="3.468"
        letterSpacing="0"
        wordSpacing="0"
        style={{ lineHeight: '1.25' }}
      >
        <tspan x="72.2" y="173.186">
          Client
        </tspan>
      </text>
    </a>
  </g>
)

export default Client
