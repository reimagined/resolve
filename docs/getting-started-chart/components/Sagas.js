import React, { useState } from 'react'

const Sagas = ({ selected, onClick }) => (
  <g className="box-child-framed box-interactive" data-selected={selected}>
    <a onClick={onClick}>
      <path
        d="M50.266 191.13H60.907V196.995H50.266z"
        paintOrder="fill markers stroke"
      ></path>
      <text
        x="55.57"
        y="194.612"
        strokeWidth="0.265"
        fontFamily="sans-serif"
        fontSize="2.056"
        letterSpacing="0"
        wordSpacing="0"
        style={{ lineHeight: '1.25' }}
      >
        <tspan
          x="55.57"
          y="194.612"
          textAnchor="middle"
          style={{
            fontFeatureSettings: 'normal',
            fontVariantCaps: 'normal',
            fontVariantLigatures: 'normal',
            fontVariantNumeric: 'normal',
          }}
        >
          Sagas
        </tspan>
      </text>
    </a>
  </g>
)

export default Sagas
