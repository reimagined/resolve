import React, { useState } from 'react'

const Server = ({ selected, onClick }) => (
  <g id="interactscm-server" className="box-framed" data-selected={selected}>
    <path
      fill="#dae1f6"
      stroke="#3949ab"
      strokeLinejoin="round"
      strokeWidth="0.5"
      d="M24.438 142.25H66.3V199.947H24.438z"
      paintOrder="fill markers stroke"
    ></path>
    <a onClick={onClick}>
      <path
        fill="#3949ab"
        d="M24.438 142.25H66.3V146.794H24.438z"
        paintOrder="fill markers stroke"
        className="box-header box-interactive"
      ></path>
      <text
        x="25.448"
        y="145.519"
        fill="#fff"
        strokeWidth="0.087"
        fontFamily="sans-serif"
        fontSize="3.468"
        letterSpacing="0"
        wordSpacing="0"
        style={{ lineHeight: '1.25' }}
        className="box-header-text"
      >
        <tspan x="25.448" y="145.519">
          reSolve Server
        </tspan>
      </text>
    </a>
  </g>
)

export default Server
