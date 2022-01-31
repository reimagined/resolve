"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[1860],{3736:(e,t,n)=>{n.r(t),n.d(t,{frontMatter:()=>s,contentTitle:()=>d,metadata:()=>i,toc:()=>c,default:()=>u});var a=n(2685),r=n(1244),o=(n(7378),n(5318)),l=["components"],s={id:"resolve-redux",title:"@resolve-js/redux",description:"The reSolve framework includes the client @resolve-js/redux library used to connect a client React + Redux app to a reSolve-powered backend."},d=void 0,i={unversionedId:"api/client/resolve-redux",id:"api/client/resolve-redux",isDocsHomePage:!1,title:"@resolve-js/redux",description:"The reSolve framework includes the client @resolve-js/redux library used to connect a client React + Redux app to a reSolve-powered backend.",source:"@site/../docs/api/client/resolve-redux.md",sourceDirName:"api/client",slug:"/api/client/resolve-redux",permalink:"/resolve/docs/api/client/resolve-redux",tags:[],version:"current",frontMatter:{id:"resolve-redux",title:"@resolve-js/redux",description:"The reSolve framework includes the client @resolve-js/redux library used to connect a client React + Redux app to a reSolve-powered backend."},sidebar:"docs",previous:{title:"Client Entry Point",permalink:"/resolve/docs/api/client/entry-point"},next:{title:"@resolve-js/client",permalink:"/resolve/docs/api/client/resolve-client"}},c=[{value:"React Hooks",id:"react-hooks",children:[{value:"<code>useReduxCommand</code>",id:"usereduxcommand",children:[{value:"Example",id:"example",children:[],level:5}],level:3},{value:"<code>useReduxReadModel</code>",id:"usereduxreadmodel",children:[{value:"Example",id:"example-1",children:[],level:5}],level:3},{value:"<code>useReduxReadModelSelector</code>",id:"usereduxreadmodelselector",children:[],level:3},{value:"<code>useReduxViewModel</code>",id:"usereduxviewmodel",children:[],level:3},{value:"<code>useReduxViewModelSelector</code>",id:"usereduxviewmodelselector",children:[],level:3}],level:2},{value:"Higher-Order Components",id:"higher-order-components",children:[{value:"<code>connectViewModel</code>",id:"connectviewmodel",children:[{value:"Example",id:"example-2",children:[],level:5}],level:3},{value:"<code>connectReadModel</code>",id:"connectreadmodel",children:[{value:"Example",id:"example-3",children:[],level:5}],level:3},{value:"<code>connectRootBasedUrls</code>",id:"connectrootbasedurls",children:[{value:"Example",id:"example-4",children:[],level:5}],level:3},{value:"<code>connectStaticBasedUrls</code>",id:"connectstaticbasedurls",children:[{value:"Example",id:"example-5",children:[],level:5}],level:3}],level:2}],p={toc:c};function u(e){var t=e.components,n=(0,r.Z)(e,l);return(0,o.kt)("wrapper",(0,a.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"The reSolve framework includes the client ",(0,o.kt)("strong",{parentName:"p"},"@resolve-js/redux")," library used to connect a client React + Redux app to a reSolve-powered backend. This library includes both React Hooks and Higher-Order Components (HOCs)."),(0,o.kt)("h2",{id:"react-hooks"},"React Hooks"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:null},"Function Name"),(0,o.kt)("th",{parentName:"tr",align:null},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usereduxcommand"},(0,o.kt)("inlineCode",{parentName:"a"},"useReduxCommand"))),(0,o.kt)("td",{parentName:"tr",align:null},"Creates a hook that executes a command.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usereduxreadmodel"},(0,o.kt)("inlineCode",{parentName:"a"},"useReduxReadModel"))),(0,o.kt)("td",{parentName:"tr",align:null},"Creates a hook that queries a Read Model.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usereduxreadmodelselector"},(0,o.kt)("inlineCode",{parentName:"a"},"useReduxReadModelSelector"))),(0,o.kt)("td",{parentName:"tr",align:null},"Creates a hook used to access a Read Model query result.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usereduxviewmodel"},(0,o.kt)("inlineCode",{parentName:"a"},"useReduxViewModel"))),(0,o.kt)("td",{parentName:"tr",align:null},"Creates a hook used to subscribe to View Model updates.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usereduxviewmodelselector"},(0,o.kt)("inlineCode",{parentName:"a"},"useReduxViewModelSelector"))),(0,o.kt)("td",{parentName:"tr",align:null},"Creates a hook used to access a View Model's state.")))),(0,o.kt)("h3",{id:"usereduxcommand"},(0,o.kt)("inlineCode",{parentName:"h3"},"useReduxCommand")),(0,o.kt)("p",null,"Creates a hook that executes a reSolve command."),(0,o.kt)("h5",{id:"example"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const { execute: toggleItem } = useReduxCommand({\n  type: 'toggleShoppingItem',\n  aggregateId: shoppingListId,\n  aggregateName: 'ShoppingList',\n  payload: {\n    id: 'shopping-list-id',\n  },\n})\n")),(0,o.kt)("h3",{id:"usereduxreadmodel"},(0,o.kt)("inlineCode",{parentName:"h3"},"useReduxReadModel")),(0,o.kt)("p",null,"Creates a hook that queries a Read Model."),(0,o.kt)("h5",{id:"example-1"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const { request: getLists, selector: allLists } = useReduxReadModel(\n  {\n    name: 'ShoppingLists',\n    resolver: 'all',\n    args: {\n      filter: 'none',\n    },\n  },\n  []\n)\n\nconst { status, data } = useSelector(allLists)\n")),(0,o.kt)("h3",{id:"usereduxreadmodelselector"},(0,o.kt)("inlineCode",{parentName:"h3"},"useReduxReadModelSelector")),(0,o.kt)("p",null,"Creates a hook used to access the result of a Read Model query. This hook allows you to access data queried by ",(0,o.kt)("inlineCode",{parentName:"p"},"useReduxReadModel")," and does not send any requests to the server."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const { request: getLists, selector: allLists } = useReduxReadModel(\n  {\n    name: 'ShoppingLists',\n    resolver: 'all',\n    args: {\n      filter: 'none',\n    },\n  },\n  [],\n  {\n    selectorId: 'all-user-lists',\n  }\n)\n\nconst { status, data } = useReduxReadModelSelector('all-user-lists')\n")),(0,o.kt)("h3",{id:"usereduxviewmodel"},(0,o.kt)("inlineCode",{parentName:"h3"},"useReduxViewModel")),(0,o.kt)("p",null,"Creates a hook used to subscribe to View Model updates."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const { connect, dispose, selector: thisList } = useReduxViewModel({\n  name: 'shoppingList',\n  aggregateIds: ['my-list'],\n})\n\nconst { data, status } = useSelector(thisList)\n\nuseEffect(() => {\n  connect()\n  return () => {\n    dispose()\n  }\n}, [])\n")),(0,o.kt)("h3",{id:"usereduxviewmodelselector"},(0,o.kt)("inlineCode",{parentName:"h3"},"useReduxViewModelSelector")),(0,o.kt)("p",null,"Creates a hook used to access a View Model's state. This hook queries the View Model's state on the client and does not send any requests to the server."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const { connect, dispose, selector: thisList } = useReduxViewModel(\n  {\n    name: 'shoppingList',\n    aggregateIds: ['my-list'],\n  },\n  {\n    selectorId: 'this-list',\n  }\n)\n\nconst { data, status } = useReduxViewModelSelector('this-list')\n")),(0,o.kt)("h2",{id:"higher-order-components"},"Higher-Order Components"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:null},"Function Name"),(0,o.kt)("th",{parentName:"tr",align:null},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#connectviewmodel"},(0,o.kt)("inlineCode",{parentName:"a"},"connectViewModel"))),(0,o.kt)("td",{parentName:"tr",align:null},"Connects a React component to a reSolve View Model.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#connectreadmodel"},(0,o.kt)("inlineCode",{parentName:"a"},"connectReadModel"))),(0,o.kt)("td",{parentName:"tr",align:null},"Connects a React component to a reSolve Read Model.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#connectrootbasedurls"},(0,o.kt)("inlineCode",{parentName:"a"},"connectRootBasedUrls"))),(0,o.kt)("td",{parentName:"tr",align:null},"Fixes URLs passed to the specified props so that they use the correct root folder path.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#connectstaticbasedurls"},(0,o.kt)("inlineCode",{parentName:"a"},"connectStaticBasedUrls"))),(0,o.kt)("td",{parentName:"tr",align:null},"Fixes URLs passed to the specified props so that they use the correct static resource folder path.")))),(0,o.kt)("h3",{id:"connectviewmodel"},(0,o.kt)("inlineCode",{parentName:"h3"},"connectViewModel")),(0,o.kt)("p",null,"Connects a React component to a reSolve View Model."),(0,o.kt)("h5",{id:"example-2"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"export const mapStateToOptions = (state, ownProps) => {\n  const aggregateId = ownProps.match.params.id\n\n  return {\n    viewModelName: 'ShoppingList',\n    aggregateIds: [aggregateId],\n  }\n}\n\nexport const mapStateToProps = (state, ownProps) => {\n  const aggregateId = ownProps.match.params.id\n\n  return {\n    aggregateId,\n  }\n}\n\nexport const mapDispatchToProps = (dispatch) =>\n  bindActionCreators(\n    {\n      replaceUrl: routerActions.replace,\n    },\n    dispatch\n  )\n\nexport default connectViewModel(mapStateToOptions)(\n  connect(mapStateToProps, mapDispatchToProps)(ShoppingList)\n)\n")),(0,o.kt)("h3",{id:"connectreadmodel"},(0,o.kt)("inlineCode",{parentName:"h3"},"connectReadModel")),(0,o.kt)("p",null,"Connects a React component to a reSolve Read Model."),(0,o.kt)("h5",{id:"example-3"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"import { sendAggregateAction } from '@resolve-js/redux'\nimport { bindActionCreators } from 'redux'\n\nexport const mapStateToOptions = () => ({\n  readModelName: 'ShoppingLists',\n  resolverName: 'all',\n  resolverArgs: {},\n})\n\nexport const mapStateToProps = (state, ownProps) => ({\n  lists: ownProps.data,\n})\n\nexport const mapDispatchToProps = (dispatch) =>\n  bindActionCreators(\n    {\n      createStory: sendAggregateAction.bind(null, 'Story', 'createStory'),\n    },\n    dispatch\n  )\n\nexport default connectReadModel(mapStateToOptions)(\n  connect(mapStateToProps, mapDispatchToProps)(MyLists)\n)\n")),(0,o.kt)("h3",{id:"connectrootbasedurls"},(0,o.kt)("inlineCode",{parentName:"h3"},"connectRootBasedUrls")),(0,o.kt)("p",null,"Fixes URLs passed to the specified props and ensures they use the correct root folder path."),(0,o.kt)("h5",{id:"example-4"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"export default connectRootBasedUrls(['href'])(Link)\n")),(0,o.kt)("h3",{id:"connectstaticbasedurls"},(0,o.kt)("inlineCode",{parentName:"h3"},"connectStaticBasedUrls")),(0,o.kt)("p",null,"Fixes URLs passed to the specified props to correct the static resource folder path."),(0,o.kt)("h5",{id:"example-5"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"export default connectStaticBasedUrls(['css', 'favicon'])(Header)\n")))}u.isMDXComponent=!0},5318:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>m});var a=n(7378);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var d=a.createContext({}),i=function(e){var t=a.useContext(d),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},c=function(e){var t=i(e.components);return a.createElement(d.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,d=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),u=i(n),m=r,h=u["".concat(d,".").concat(m)]||u[m]||p[m]||o;return n?a.createElement(h,l(l({ref:t},c),{},{components:n})):a.createElement(h,l({ref:t},c))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,l=new Array(o);l[0]=u;var s={};for(var d in t)hasOwnProperty.call(t,d)&&(s[d]=t[d]);s.originalType=e,s.mdxType="string"==typeof e?e:r,l[1]=s;for(var i=2;i<o;i++)l[i]=n[i];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"}}]);