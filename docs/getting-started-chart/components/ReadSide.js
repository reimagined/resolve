import React, { useState } from 'react'

const ReadSide = ({ selected, onClick }) => (
  <g id="interactscm-readside" data-selected={selected}>
    <a onClick={onClick}>
      <path d="M130 314H410V414H130V314Z" fill="#D3E0F3" />
      <path
        d="M226.956 344V330.909H232.121C233.11 330.909 233.953 331.086 234.652 331.44C235.355 331.789 235.89 332.286 236.257 332.929C236.627 333.568 236.813 334.32 236.813 335.185C236.813 336.055 236.625 336.803 236.25 337.429C235.875 338.051 235.332 338.528 234.62 338.861C233.913 339.193 233.056 339.359 232.051 339.359H228.593V337.135H231.603C232.132 337.135 232.57 337.062 232.92 336.918C233.269 336.773 233.529 336.555 233.7 336.266C233.874 335.976 233.962 335.616 233.962 335.185C233.962 334.751 233.874 334.384 233.7 334.086C233.529 333.788 233.267 333.562 232.914 333.408C232.564 333.251 232.123 333.172 231.59 333.172H229.724V344H226.956ZM234.026 338.043L237.279 344H234.224L231.041 338.043H234.026ZM243.034 344.192C242.024 344.192 241.154 343.987 240.426 343.578C239.701 343.165 239.143 342.581 238.751 341.827C238.359 341.068 238.163 340.171 238.163 339.136C238.163 338.126 238.359 337.239 238.751 336.477C239.143 335.714 239.695 335.119 240.407 334.693C241.123 334.267 241.962 334.054 242.925 334.054C243.573 334.054 244.176 334.158 244.734 334.367C245.297 334.572 245.787 334.881 246.204 335.294C246.626 335.707 246.954 336.227 247.189 336.854C247.423 337.476 247.54 338.205 247.54 339.04V339.788H239.25V338.1H244.977C244.977 337.708 244.892 337.361 244.721 337.058C244.551 336.756 244.314 336.519 244.012 336.349C243.713 336.174 243.366 336.087 242.97 336.087C242.556 336.087 242.19 336.183 241.87 336.374C241.555 336.562 241.308 336.815 241.129 337.135C240.95 337.45 240.858 337.802 240.854 338.19V339.794C240.854 340.28 240.944 340.7 241.123 341.053C241.306 341.407 241.564 341.68 241.896 341.871C242.228 342.063 242.623 342.159 243.078 342.159C243.381 342.159 243.658 342.116 243.909 342.031C244.161 341.946 244.376 341.818 244.555 341.648C244.734 341.477 244.87 341.268 244.964 341.021L247.483 341.188C247.355 341.793 247.093 342.321 246.696 342.773C246.304 343.22 245.797 343.57 245.175 343.821C244.557 344.068 243.843 344.192 243.034 344.192ZM252.117 344.185C251.49 344.185 250.932 344.077 250.442 343.859C249.952 343.638 249.564 343.312 249.279 342.881C248.998 342.447 248.857 341.906 248.857 341.258C248.857 340.712 248.957 340.254 249.157 339.884C249.358 339.513 249.63 339.214 249.975 338.989C250.321 338.763 250.713 338.592 251.152 338.477C251.595 338.362 252.059 338.281 252.545 338.234C253.116 338.175 253.576 338.119 253.926 338.068C254.275 338.013 254.529 337.932 254.686 337.825C254.844 337.719 254.923 337.561 254.923 337.352V337.314C254.923 336.909 254.795 336.596 254.539 336.374C254.288 336.153 253.93 336.042 253.466 336.042C252.975 336.042 252.586 336.151 252.296 336.368C252.006 336.581 251.814 336.849 251.721 337.173L249.202 336.969C249.33 336.372 249.581 335.857 249.956 335.422C250.331 334.983 250.815 334.646 251.407 334.412C252.004 334.173 252.694 334.054 253.478 334.054C254.024 334.054 254.546 334.118 255.044 334.246C255.547 334.374 255.993 334.572 256.38 334.84C256.772 335.109 257.081 335.454 257.307 335.876C257.533 336.293 257.646 336.794 257.646 337.378V344H255.064V342.638H254.987C254.829 342.945 254.618 343.216 254.354 343.45C254.09 343.68 253.772 343.862 253.402 343.994C253.031 344.121 252.603 344.185 252.117 344.185ZM252.897 342.306C253.297 342.306 253.651 342.227 253.958 342.07C254.265 341.908 254.505 341.69 254.68 341.418C254.855 341.145 254.942 340.836 254.942 340.491V339.449C254.857 339.504 254.74 339.555 254.591 339.602C254.446 339.645 254.282 339.685 254.098 339.724C253.915 339.758 253.732 339.79 253.549 339.82C253.365 339.845 253.199 339.869 253.05 339.89C252.73 339.937 252.451 340.011 252.213 340.114C251.974 340.216 251.789 340.354 251.657 340.529C251.525 340.7 251.458 340.913 251.458 341.168C251.458 341.539 251.593 341.822 251.861 342.018C252.134 342.21 252.479 342.306 252.897 342.306ZM263.376 344.16C262.631 344.16 261.955 343.968 261.35 343.585C260.749 343.197 260.272 342.628 259.918 341.878C259.569 341.124 259.394 340.199 259.394 339.104C259.394 337.979 259.575 337.043 259.938 336.298C260.3 335.548 260.781 334.987 261.382 334.616C261.987 334.241 262.65 334.054 263.37 334.054C263.92 334.054 264.378 334.148 264.744 334.335C265.115 334.518 265.413 334.749 265.639 335.026C265.869 335.298 266.044 335.567 266.163 335.831H266.246V330.909H268.963V344H266.278V342.428H266.163C266.036 342.7 265.854 342.971 265.62 343.239C265.39 343.504 265.089 343.723 264.719 343.898C264.352 344.072 263.905 344.16 263.376 344.16ZM264.239 341.993C264.678 341.993 265.049 341.874 265.352 341.635C265.658 341.392 265.893 341.053 266.055 340.619C266.221 340.184 266.304 339.675 266.304 339.091C266.304 338.507 266.223 338 266.061 337.57C265.899 337.139 265.665 336.807 265.358 336.572C265.051 336.338 264.678 336.221 264.239 336.221C263.792 336.221 263.415 336.342 263.108 336.585C262.801 336.828 262.569 337.165 262.411 337.595C262.254 338.026 262.175 338.524 262.175 339.091C262.175 339.662 262.254 340.167 262.411 340.606C262.573 341.04 262.805 341.381 263.108 341.629C263.415 341.871 263.792 341.993 264.239 341.993ZM282.521 334.674C282.469 334.158 282.25 333.758 281.862 333.472C281.474 333.187 280.948 333.044 280.283 333.044C279.832 333.044 279.45 333.108 279.139 333.236C278.828 333.359 278.589 333.532 278.423 333.754C278.261 333.975 278.18 334.227 278.18 334.508C278.172 334.742 278.221 334.947 278.327 335.121C278.438 335.296 278.589 335.447 278.781 335.575C278.973 335.699 279.195 335.808 279.446 335.901C279.697 335.991 279.966 336.067 280.251 336.131L281.428 336.413C281.999 336.54 282.523 336.711 283 336.924C283.477 337.137 283.891 337.399 284.24 337.71C284.589 338.021 284.86 338.388 285.052 338.81C285.248 339.232 285.348 339.715 285.352 340.261C285.348 341.062 285.143 341.756 284.739 342.344C284.338 342.928 283.759 343.382 283 343.706C282.246 344.026 281.336 344.185 280.271 344.185C279.214 344.185 278.293 344.023 277.509 343.7C276.729 343.376 276.12 342.896 275.681 342.261C275.246 341.622 275.018 340.832 274.997 339.89H277.675C277.705 340.329 277.831 340.695 278.053 340.989C278.278 341.279 278.579 341.499 278.954 341.648C279.333 341.793 279.761 341.865 280.239 341.865C280.707 341.865 281.114 341.797 281.46 341.661C281.809 341.524 282.08 341.335 282.271 341.092C282.463 340.849 282.559 340.57 282.559 340.254C282.559 339.96 282.472 339.713 282.297 339.513C282.126 339.312 281.875 339.142 281.543 339.001C281.214 338.861 280.812 338.733 280.335 338.618L278.909 338.26C277.805 337.991 276.934 337.572 276.295 337.001C275.656 336.43 275.338 335.661 275.342 334.693C275.338 333.901 275.549 333.208 275.975 332.616C276.406 332.023 276.996 331.561 277.746 331.229C278.496 330.896 279.348 330.73 280.303 330.73C281.274 330.73 282.122 330.896 282.847 331.229C283.575 331.561 284.142 332.023 284.547 332.616C284.952 333.208 285.161 333.894 285.173 334.674H282.521ZM287.163 344V334.182H289.886V344H287.163ZM288.531 332.916C288.126 332.916 287.779 332.782 287.489 332.513C287.203 332.241 287.061 331.915 287.061 331.536C287.061 331.161 287.203 330.839 287.489 330.57C287.779 330.298 288.126 330.161 288.531 330.161C288.936 330.161 289.281 330.298 289.566 330.57C289.856 330.839 290.001 331.161 290.001 331.536C290.001 331.915 289.856 332.241 289.566 332.513C289.281 332.782 288.936 332.916 288.531 332.916ZM295.685 344.16C294.939 344.16 294.264 343.968 293.659 343.585C293.058 343.197 292.581 342.628 292.227 341.878C291.877 341.124 291.703 340.199 291.703 339.104C291.703 337.979 291.884 337.043 292.246 336.298C292.608 335.548 293.09 334.987 293.691 334.616C294.296 334.241 294.958 334.054 295.679 334.054C296.228 334.054 296.686 334.148 297.053 334.335C297.424 334.518 297.722 334.749 297.948 335.026C298.178 335.298 298.353 335.567 298.472 335.831H298.555V330.909H301.272V344H298.587V342.428H298.472C298.344 342.7 298.163 342.971 297.929 343.239C297.699 343.504 297.398 343.723 297.027 343.898C296.661 344.072 296.213 344.16 295.685 344.16ZM296.548 341.993C296.987 341.993 297.358 341.874 297.66 341.635C297.967 341.392 298.201 341.053 298.363 340.619C298.529 340.184 298.613 339.675 298.613 339.091C298.613 338.507 298.532 338 298.37 337.57C298.208 337.139 297.973 336.807 297.667 336.572C297.36 336.338 296.987 336.221 296.548 336.221C296.1 336.221 295.723 336.342 295.417 336.585C295.11 336.828 294.877 337.165 294.72 337.595C294.562 338.026 294.483 338.524 294.483 339.091C294.483 339.662 294.562 340.167 294.72 340.606C294.882 341.04 295.114 341.381 295.417 341.629C295.723 341.871 296.1 341.993 296.548 341.993ZM307.985 344.192C306.975 344.192 306.106 343.987 305.377 343.578C304.653 343.165 304.094 342.581 303.702 341.827C303.31 341.068 303.114 340.171 303.114 339.136C303.114 338.126 303.31 337.239 303.702 336.477C304.094 335.714 304.646 335.119 305.358 334.693C306.074 334.267 306.913 334.054 307.876 334.054C308.524 334.054 309.127 334.158 309.685 334.367C310.248 334.572 310.738 334.881 311.155 335.294C311.577 335.707 311.905 336.227 312.14 336.854C312.374 337.476 312.491 338.205 312.491 339.04V339.788H304.201V338.1H309.928C309.928 337.708 309.843 337.361 309.672 337.058C309.502 336.756 309.265 336.519 308.963 336.349C308.665 336.174 308.317 336.087 307.921 336.087C307.508 336.087 307.141 336.183 306.822 336.374C306.506 336.562 306.259 336.815 306.08 337.135C305.901 337.45 305.809 337.802 305.805 338.19V339.794C305.805 340.28 305.895 340.7 306.074 341.053C306.257 341.407 306.515 341.68 306.847 341.871C307.18 342.063 307.574 342.159 308.03 342.159C308.332 342.159 308.609 342.116 308.861 342.031C309.112 341.946 309.327 341.818 309.506 341.648C309.685 341.477 309.822 341.268 309.915 341.021L312.434 341.188C312.306 341.793 312.044 342.321 311.648 342.773C311.256 343.22 310.748 343.57 310.126 343.821C309.508 344.068 308.795 344.192 307.985 344.192Z"
        fill="#27303F"
      />
    </a>
  </g>
)

export default ReadSide