(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[3825],{5318:(e,t,a)=>{"use strict";a.d(t,{Zo:()=>s,kt:()=>u});var n=a(7378);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},l=Object.keys(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var d=n.createContext({}),m=function(e){var t=n.useContext(d),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},s=function(e){var t=m(e.components);return n.createElement(d.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},p=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,l=e.originalType,d=e.parentName,s=o(e,["components","mdxType","originalType","parentName"]),p=m(a),u=r,g=p["".concat(d,".").concat(u)]||p[u]||c[u]||l;return a?n.createElement(g,i(i({ref:t},s),{},{components:a})):n.createElement(g,i({ref:t},s))}));function u(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=a.length,i=new Array(l);i[0]=p;var o={};for(var d in t)hasOwnProperty.call(t,d)&&(o[d]=t[d]);o.originalType=e,o.mdxType="string"==typeof e?e:r,i[1]=o;for(var m=2;m<l;m++)i[m]=a[m];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}p.displayName="MDXCreateElement"},7383:(e,t,a)=>{"use strict";a.r(t),a.d(t,{frontMatter:()=>o,contentTitle:()=>d,metadata:()=>m,toc:()=>s,default:()=>p});var n=a(9603),r=a(120),l=(a(7378),a(5318)),i=["components"],o={id:"saga",title:"Saga"},d=void 0,m={unversionedId:"api/saga",id:"api/saga",isDocsHomePage:!1,title:"Saga",description:"A saga's event handler receives an object that provides access to the saga-related API. This API includes the following objects:",source:"@site/../docs/api/saga.md",sourceDirName:"api",slug:"/api/saga",permalink:"/resolve/docs/api/saga",version:"current",frontMatter:{id:"saga",title:"Saga"},sidebar:"docs",previous:{title:"API Handler",permalink:"/resolve/docs/api/api-handler"},next:{title:"reSolve Scripts",permalink:"/resolve/docs/api/resolve-scripts"}},s=[{value:"executeCommand",id:"executecommand",children:[]},{value:"scheduleCommand",id:"schedulecommand",children:[]}],c={toc:s};function p(e){var t=e.components,a=(0,r.Z)(e,i);return(0,l.kt)("wrapper",(0,n.Z)({},c,a,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("p",null,"A saga's event handler receives an object that provides access to the saga-related API. This API includes the following objects:"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Object Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"store"),(0,l.kt)("td",{parentName:"tr",align:null},"Provides access to the saga's persistent store (similar to the Read Model store).")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"sideEffects"),(0,l.kt)("td",{parentName:"tr",align:null},"Provides access to the saga's side effect functions.")))),(0,l.kt)("p",null,"In addition to user-defined side effect functions, the ",(0,l.kt)("inlineCode",{parentName:"p"},"SideEffects")," object contains the following default side effects:"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Function Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#executecommand"},"executeCommand")),(0,l.kt)("td",{parentName:"tr",align:null},"Sends a command with the specified payload to an aggregate.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#schedulecommand"},"scheduleCommand")),(0,l.kt)("td",{parentName:"tr",align:null},"Similar to ",(0,l.kt)("inlineCode",{parentName:"td"},"executeCommand"),", but delays command execution until a specified moment in time.")))),(0,l.kt)("p",null,"The ",(0,l.kt)("inlineCode",{parentName:"p"},"sideEffects")," object's ",(0,l.kt)("inlineCode",{parentName:"p"},"isEnabled")," field indicates whether or not side effects are enabled for the saga."),(0,l.kt)("h3",{id:"executecommand"},"executeCommand"),(0,l.kt)("p",null,"Sends a command with the specified payload to an aggregate."),(0,l.kt)("h4",{id:"arguments"},"Arguments"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Argument Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"command"),(0,l.kt)("td",{parentName:"tr",align:null},"Specifies a command object. Refer to the ",(0,l.kt)("a",{parentName:"td",href:"/resolve/docs/write-side#sending-a-command"},"Write Side")," article for more information.")))),(0,l.kt)("h4",{id:"example"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"await sideEffects.executeCommand({\n  aggregateName: 'User',\n  aggregateId: event.aggregateId,\n  type: 'requestConfirmUser',\n  payload: event.payload\n})\n")),(0,l.kt)("h3",{id:"schedulecommand"},"scheduleCommand"),(0,l.kt)("p",null,"Similar to ",(0,l.kt)("inlineCode",{parentName:"p"},"executeCommand")," but delays the command's execution until a specified moment in time."),(0,l.kt)("h4",{id:"arguments-1"},"Arguments"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Argument Name"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},"command"),(0,l.kt)("td",{parentName:"tr",align:null},"Specifies a command object. Refer to the ",(0,l.kt)("a",{parentName:"td",href:"/resolve/docs/write-side#sending-a-command"},"Write Side")," article for more information.")))),(0,l.kt)("h4",{id:"example-1"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"await sideEffects.scheduleCommand(\n  event.timestamp + 1000 * 60 * 60 * 24 * 7,\n  {\n    aggregateName: 'User',\n    aggregateId: event.aggregateId,\n    type: 'forgetUser',\n    payload: {}\n  }\n)\n")))}p.isMDXComponent=!0}}]);