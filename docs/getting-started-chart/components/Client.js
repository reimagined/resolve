import React from 'react'

const Client = ({ selected, onClick }) => (
  <g className="box-outer" data-selected={selected} onClick={onClick}>
    <path className="box" d="M470 43H550V414H470V43Z" />
    <path
      className="caption"
      d="M496.541 220.492C496.176 217.469 493.888 215.73 490.858 215.73C487.4 215.73 484.76 218.172 484.76 222.455C484.76 226.724 487.355 229.179 490.858 229.179C494.214 229.179 496.24 226.948 496.541 224.538L493.741 224.526C493.479 225.925 492.38 226.731 490.903 226.731C488.915 226.731 487.566 225.254 487.566 222.455C487.566 219.732 488.896 218.178 490.922 218.178C492.437 218.178 493.53 219.054 493.741 220.492H496.541ZM501.197 215.909H498.474V229H501.197V215.909ZM503.379 229H506.102V219.182H503.379V229ZM504.747 217.916C505.558 217.916 506.223 217.296 506.223 216.536C506.223 215.781 505.558 215.161 504.747 215.161C503.941 215.161 503.276 215.781 503.276 216.536C503.276 217.296 503.941 217.916 504.747 217.916ZM512.757 229.192C515.186 229.192 516.823 228.009 517.206 226.188L514.688 226.021C514.413 226.769 513.71 227.159 512.802 227.159C511.441 227.159 510.578 226.258 510.578 224.794V224.788H517.264V224.04C517.264 220.703 515.244 219.054 512.649 219.054C509.759 219.054 507.887 221.106 507.887 224.136C507.887 227.249 509.734 229.192 512.757 229.192ZM510.578 223.1C510.635 221.982 511.485 221.087 512.693 221.087C513.876 221.087 514.694 221.93 514.701 223.1H510.578ZM521.764 223.324C521.77 222.058 522.524 221.317 523.624 221.317C524.717 221.317 525.375 222.033 525.369 223.234V229H528.092V222.749C528.092 220.46 526.75 219.054 524.704 219.054C523.247 219.054 522.192 219.77 521.751 220.914H521.636V219.182H519.041V229H521.764V223.324ZM535.46 219.182H533.613V216.83H530.89V219.182H529.548V221.227H530.89V226.341C530.877 228.265 532.188 229.217 534.163 229.134C534.866 229.109 535.364 228.968 535.639 228.879L535.211 226.852C535.077 226.878 534.789 226.942 534.533 226.942C533.99 226.942 533.613 226.737 533.613 225.983V221.227H535.46V219.182Z"
    />
  </g>
)

export default Client
