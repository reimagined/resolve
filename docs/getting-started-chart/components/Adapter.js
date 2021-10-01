import React, { useState } from 'react'

const Adapter = ({ selected, onClick }) => (
  <g
    id="interactscm-esadapter"
    className="box-solid box-interactive"
    data-selected={selected}
  >
    <a onClick={onClick}>
      <path
        fill="#3949ab"
        d="M157.25 109.21H168.38V120.33999999999999H157.25z"
        paintOrder="fill markers stroke"
        transform="scale(1.10538 .88213) rotate(45)"
      ></path>
      <text
        x="37.536"
        y="171.114"
        fill="#fff"
        strokeWidth="0.265"
        fontFamily="sans-serif"
        fontSize="2.056"
        letterSpacing="0"
        textAnchor="middle"
        wordSpacing="0"
        style={{
          fontFeatureSettings: 'normal',
          fontVariantCaps: 'normal',
          fontVariantLigatures: 'normal',
          fontVariantNumeric: 'normal',
          lineHeight: '1.25',
        }}
      >
        <tspan x="37.536" y="171.114">
          Event
        </tspan>
        <tspan x="37.536" y="173.684">
          Store
        </tspan>
        <tspan x="37.536" y="176.253">
          Adapter
        </tspan>
      </text>
    </a>
  </g>
)

export default Adapter
