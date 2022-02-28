import React from 'react'

const ApiHandlers = ({ selected, onClick }) => {
  return (
    <g className="box-inner" data-selected={selected} onClick={onClick}>
      <path className="box" d="M292 168H399V275H292V168Z" />
      <path
        className="caption"
        d="M333.56 220L334.761 216.536H339.875L341.07 220H343.167L338.456 206.909H336.174L331.463 220H333.56ZM335.337 214.874L337.267 209.287H337.369L339.3 214.874H335.337ZM345.057 220H347.032V215.398H349.717C352.753 215.398 354.256 213.563 354.256 211.147C354.256 208.737 352.766 206.909 349.724 206.909H345.057V220ZM347.032 213.723V208.603H349.513C351.469 208.603 352.268 209.664 352.268 211.147C352.268 212.63 351.469 213.723 349.538 213.723H347.032ZM358.546 206.909H356.571V220H358.546V206.909ZM308.319 238H310.294V232.292H316.82V238H318.802V224.909H316.82V230.598H310.294V224.909H308.319V238ZM324.382 238.217C326.006 238.217 326.92 237.393 327.284 236.658H327.361V238H329.227V231.48C329.227 228.623 326.977 228.054 325.418 228.054C323.641 228.054 322.004 228.77 321.365 230.56L323.161 230.969C323.443 230.272 324.159 229.601 325.443 229.601C326.677 229.601 327.31 230.246 327.31 231.359V231.403C327.31 232.1 326.594 232.087 324.83 232.292C322.97 232.509 321.065 232.995 321.065 235.226C321.065 237.156 322.516 238.217 324.382 238.217ZM324.798 236.683C323.718 236.683 322.938 236.197 322.938 235.251C322.938 234.229 323.845 233.864 324.951 233.717C325.571 233.634 327.041 233.468 327.316 233.193V234.459C327.316 235.622 326.389 236.683 324.798 236.683ZM333.684 232.17C333.684 230.604 334.643 229.71 335.973 229.71C337.27 229.71 338.056 230.56 338.056 231.985V238H339.968V231.755C339.968 229.326 338.632 228.054 336.625 228.054C335.148 228.054 334.183 228.738 333.729 229.78H333.608V228.182H331.773V238H333.684V232.17ZM346.206 238.192C347.996 238.192 348.699 237.099 349.044 236.472H349.204V238H351.071V224.909H349.159V229.773H349.044C348.699 229.166 348.047 228.054 346.219 228.054C343.848 228.054 342.103 229.927 342.103 233.11C342.103 236.287 343.822 238.192 346.206 238.192ZM346.628 236.562C344.922 236.562 344.033 235.06 344.033 233.091C344.033 231.141 344.902 229.678 346.628 229.678C348.297 229.678 349.191 231.039 349.191 233.091C349.191 235.156 348.277 236.562 346.628 236.562ZM355.71 224.909H353.798V238H355.71V224.909ZM362.512 238.198C364.654 238.198 366.169 237.143 366.603 235.545L364.794 235.219C364.449 236.146 363.618 236.619 362.532 236.619C360.895 236.619 359.796 235.558 359.745 233.666H366.725V232.989C366.725 229.441 364.603 228.054 362.378 228.054C359.642 228.054 357.84 230.138 357.84 233.155C357.84 236.204 359.617 238.198 362.512 238.198ZM359.751 232.234C359.828 230.841 360.838 229.633 362.391 229.633C363.874 229.633 364.846 230.732 364.852 232.234H359.751ZM368.845 238H370.757V232.004C370.757 230.719 371.747 229.793 373.102 229.793C373.499 229.793 373.946 229.863 374.1 229.908V228.08C373.908 228.054 373.531 228.035 373.288 228.035C372.137 228.035 371.153 228.687 370.795 229.741H370.693V228.182H368.845V238ZM383.111 230.579C382.714 229.051 381.519 228.054 379.397 228.054C377.179 228.054 375.607 229.224 375.607 230.962C375.607 232.356 376.45 233.283 378.291 233.692L379.953 234.056C380.899 234.267 381.34 234.689 381.34 235.303C381.34 236.063 380.528 236.658 379.276 236.658C378.131 236.658 377.396 236.165 377.166 235.2L375.319 235.482C375.638 237.22 377.083 238.198 379.288 238.198C381.66 238.198 383.303 236.939 383.303 235.162C383.303 233.775 382.42 232.918 380.618 232.503L379.058 232.145C377.978 231.889 377.511 231.525 377.518 230.86C377.511 230.106 378.33 229.569 379.416 229.569C380.605 229.569 381.155 230.227 381.379 230.886L383.111 230.579Z"
      />
    </g>
  )
}

export default ApiHandlers
