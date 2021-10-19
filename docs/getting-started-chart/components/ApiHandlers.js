import React, { useState } from 'react'

const ApiHandlers = ({ selected, onClick }) => {
  return (
    <g
      id="interactscm-apihandlers"
      className="box-solid box-interactive"
      data-selected={selected}
    >
      <a onClick={onClick}>
        <path
          d="M46.718 161.99H61.723000000000006V184.172H46.718z"
          paintOrder="fill markers stroke"
        ></path>
        <text
          x="54.158"
          y="172.397"
          strokeWidth="0.265"
          fontFamily="sans-serif"
          fontSize="2.559"
          letterSpacing="0"
          textAnchor="middle"
          wordSpacing="0"
          style={{ lineHeight: '1.25' }}
        >
          <tspan
            x="54.158"
            y="172.397"
            style={{
              fontFeatureSettings: 'normal',
              fontVariantCaps: 'normal',
              fontVariantLigatures: 'normal',
              fontVariantNumeric: 'normal',
            }}
          >
            API
          </tspan>
          <tspan
            x="54.158"
            y="175.596"
            style={{
              fontFeatureSettings: 'normal',
              fontVariantCaps: 'normal',
              fontVariantLigatures: 'normal',
              fontVariantNumeric: 'normal',
            }}
          >
            Handlers
          </tspan>
        </text>
      </a>
    </g>
  )
}

export default ApiHandlers
