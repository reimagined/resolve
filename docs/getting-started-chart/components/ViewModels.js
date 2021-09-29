import React, { useState } from 'react'

const ViewModels = () => (
  <g className="box-child-framed" data-selected="false">
    <path
      fill="#dae1f6"
      d="M38.681 191.13H49.321999999999996V196.995H38.681z"
      paintOrder="fill markers stroke"
    ></path>
    <text
      x="43.951"
      y="193.545"
      fill="#3949ab"
      strokeWidth="0.265"
      fontFamily="sans-serif"
      fontSize="2.056"
      letterSpacing="0"
      textAnchor="middle"
      wordSpacing="0"
      style={{ lineHeight: '1.25' }}
    >
      <tspan
        x="43.951"
        y="193.545"
        style={{
          fontFeatureSettings: 'normal',
          fontVariantCaps: 'normal',
          fontVariantLigatures: 'normal',
          fontVariantNumeric: 'normal',
        }}
      >
        View
      </tspan>
      <tspan
        x="43.951"
        y="196.114"
        style={{
          fontFeatureSettings: 'normal',
          fontVariantCaps: 'normal',
          fontVariantLigatures: 'normal',
          fontVariantNumeric: 'normal',
        }}
      >
        Models
      </tspan>
    </text>
  </g>
)

export default ViewModels
