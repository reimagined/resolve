import React, {useState} from 'react';

export default function MyComponent() {
  const [bool, setBool] = useState(false);

  const getCol = () => {
    if (bool) {
        return "#aade87"
    }
    else {
        return "#ffde87"
    }
  }

  const recClicked = () => {
      setBool(true)
  }


  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="375.039"
      height="87.326"
      viewBox="0 0 99.229 23.105"
    >
      <defs>
        <marker id="Arrow2Send" orient="auto" overflow="visible">
          <path
            fillRule="evenodd"
            stroke="#000"
            strokeLinejoin="round"
            strokeWidth="0.188"
            d="M-1.926-1.21L1.352-.005l-3.278 1.206a2.05 2.05 0 000-2.411z"
          ></path>
        </marker>
      </defs>
      <g transform="translate(-6.236 -95.48)">
        <path
          fill = { getCol() }
          d="M6.236 95.6H49.534V118.585H6.236z"
          paintOrder="fill markers stroke"
        ></path>
        <path
          fill="#aade87"
          d="M62.167 95.48H105.465V118.465H62.167z"
          paintOrder="fill markers stroke"
        ></path>
        <path
          fill="none"
          stroke="#000"
          strokeWidth="0.5"
          markerEnd="url(#Arrow2Send)"
          d="M49.326 107.82h12.851"
        ></path>
      </g>
    </svg>
  );
}