import React, { useState } from 'react'

const Aggregates = ({ selected, onClick }) => (
  <g className="box-inner" data-selected={selected}>
    <a onClick={onClick}>
      <path className="box" d="M140 89H400V122H140V89Z" />
      <path
        className="caption"
        d="M227.339 111L228.408 107.92H232.953L234.016 111H235.879L231.692 99.3636H229.663L225.476 111H227.339ZM228.919 106.443L230.635 101.477H230.726L232.442 106.443H228.919ZM240.942 114.455C243.163 114.455 244.879 113.438 244.879 111.193V102.273H243.214V103.688H243.089C242.788 103.148 242.186 102.159 240.561 102.159C238.453 102.159 236.902 103.824 236.902 106.602C236.902 109.386 238.487 110.869 240.55 110.869C242.152 110.869 242.771 109.966 243.078 109.409H243.186V111.125C243.186 112.494 242.249 113.085 240.959 113.085C239.544 113.085 238.993 112.375 238.692 111.875L237.232 112.477C237.692 113.545 238.857 114.455 240.942 114.455ZM240.925 109.46C239.408 109.46 238.618 108.295 238.618 106.58C238.618 104.903 239.391 103.602 240.925 103.602C242.408 103.602 243.203 104.812 243.203 106.58C243.203 108.381 242.391 109.46 240.925 109.46ZM250.817 114.455C253.038 114.455 254.754 113.438 254.754 111.193V102.273H253.089V103.688H252.964C252.663 103.148 252.061 102.159 250.436 102.159C248.328 102.159 246.777 103.824 246.777 106.602C246.777 109.386 248.362 110.869 250.425 110.869C252.027 110.869 252.646 109.966 252.953 109.409H253.061V111.125C253.061 112.494 252.124 113.085 250.834 113.085C249.419 113.085 248.868 112.375 248.567 111.875L247.107 112.477C247.567 113.545 248.732 114.455 250.817 114.455ZM250.8 109.46C249.283 109.46 248.493 108.295 248.493 106.58C248.493 104.903 249.266 103.602 250.8 103.602C252.283 103.602 253.078 104.812 253.078 106.58C253.078 108.381 252.266 109.46 250.8 109.46ZM257.033 111H258.732V105.67C258.732 104.528 259.612 103.705 260.817 103.705C261.169 103.705 261.567 103.767 261.703 103.807V102.182C261.533 102.159 261.197 102.142 260.982 102.142C259.959 102.142 259.084 102.722 258.766 103.659H258.675V102.273H257.033V111ZM266.622 111.176C268.526 111.176 269.872 110.239 270.259 108.818L268.651 108.528C268.344 109.352 267.605 109.773 266.639 109.773C265.185 109.773 264.207 108.83 264.162 107.148H270.366V106.545C270.366 103.392 268.48 102.159 266.503 102.159C264.071 102.159 262.469 104.011 262.469 106.693C262.469 109.403 264.048 111.176 266.622 111.176ZM264.168 105.875C264.236 104.636 265.134 103.562 266.514 103.562C267.832 103.562 268.696 104.54 268.702 105.875H264.168ZM275.911 114.455C278.132 114.455 279.848 113.438 279.848 111.193V102.273H278.183V103.688H278.058C277.757 103.148 277.155 102.159 275.53 102.159C273.422 102.159 271.871 103.824 271.871 106.602C271.871 109.386 273.456 110.869 275.518 110.869C277.121 110.869 277.74 109.966 278.047 109.409H278.155V111.125C278.155 112.494 277.217 113.085 275.928 113.085C274.513 113.085 273.962 112.375 273.661 111.875L272.2 112.477C272.661 113.545 273.825 114.455 275.911 114.455ZM275.893 109.46C274.376 109.46 273.587 108.295 273.587 106.58C273.587 104.903 274.359 103.602 275.893 103.602C277.376 103.602 278.172 104.812 278.172 106.58C278.172 108.381 277.359 109.46 275.893 109.46ZM284.666 111.193C286.109 111.193 286.922 110.46 287.246 109.807H287.314V111H288.973V105.205C288.973 102.665 286.973 102.159 285.587 102.159C284.007 102.159 282.553 102.795 281.984 104.386L283.581 104.75C283.831 104.131 284.467 103.534 285.609 103.534C286.706 103.534 287.268 104.108 287.268 105.097V105.136C287.268 105.756 286.632 105.744 285.064 105.926C283.411 106.119 281.717 106.551 281.717 108.534C281.717 110.25 283.007 111.193 284.666 111.193ZM285.036 109.83C284.075 109.83 283.382 109.398 283.382 108.557C283.382 107.648 284.189 107.324 285.172 107.193C285.723 107.119 287.03 106.972 287.274 106.727V107.852C287.274 108.886 286.45 109.83 285.036 109.83ZM295.31 102.273H293.52V100.182H291.821V102.273H290.543V103.636H291.821V108.79C291.815 110.375 293.026 111.142 294.366 111.114C294.906 111.108 295.27 111.006 295.469 110.932L295.162 109.528C295.048 109.551 294.838 109.602 294.565 109.602C294.014 109.602 293.52 109.42 293.52 108.438V103.636H295.31V102.273ZM300.857 111.176C302.76 111.176 304.107 110.239 304.493 108.818L302.885 108.528C302.578 109.352 301.839 109.773 300.874 109.773C299.419 109.773 298.442 108.83 298.396 107.148H304.601V106.545C304.601 103.392 302.714 102.159 300.737 102.159C298.305 102.159 296.703 104.011 296.703 106.693C296.703 109.403 298.283 111.176 300.857 111.176ZM298.402 105.875C298.47 104.636 299.368 103.562 300.749 103.562C302.067 103.562 302.93 104.54 302.936 105.875H298.402ZM313.026 104.403C312.673 103.045 311.611 102.159 309.724 102.159C307.753 102.159 306.355 103.199 306.355 104.744C306.355 105.983 307.105 106.807 308.741 107.17L310.219 107.494C311.06 107.682 311.452 108.057 311.452 108.602C311.452 109.278 310.73 109.807 309.616 109.807C308.599 109.807 307.946 109.369 307.741 108.511L306.099 108.761C306.384 110.307 307.668 111.176 309.628 111.176C311.736 111.176 313.196 110.057 313.196 108.477C313.196 107.244 312.412 106.483 310.81 106.114L309.423 105.795C308.463 105.568 308.048 105.244 308.054 104.653C308.048 103.983 308.776 103.506 309.741 103.506C310.798 103.506 311.287 104.091 311.486 104.676L313.026 104.403Z"
      />
    </a>
  </g>
)

export default Aggregates
