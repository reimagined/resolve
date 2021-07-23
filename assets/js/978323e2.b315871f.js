(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[8690],{5318:(e,t,n)=>{"use strict";n.d(t,{Zo:()=>c,kt:()=>m});var a=n(7378);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),p=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},c=function(e){var t=p(e.components);return a.createElement(i.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,i=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),u=p(n),m=r,g=u["".concat(i,".").concat(m)]||u[m]||d[m]||o;return n?a.createElement(g,s(s({ref:t},c),{},{components:n})):a.createElement(g,s({ref:t},c))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,s=new Array(o);s[0]=u;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l.mdxType="string"==typeof e?e:r,s[1]=l;for(var p=2;p<o;p++)s[p]=n[p];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},2665:(e,t,n)=>{"use strict";n.r(t),n.d(t,{frontMatter:()=>l,contentTitle:()=>i,metadata:()=>p,toc:()=>c,default:()=>u});var a=n(9603),r=n(120),o=(n(7378),n(5318)),s=["components"],l={id:"resolve-react-hooks",title:"@resolve-js/react-hooks"},i=void 0,p={unversionedId:"api/client/resolve-react-hooks",id:"api/client/resolve-react-hooks",isDocsHomePage:!1,title:"@resolve-js/react-hooks",description:"The @resolve-js/react-hooks library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided.",source:"@site/../docs/api/client/resolve-react-hooks.md",sourceDirName:"api/client",slug:"/api/client/resolve-react-hooks",permalink:"/resolve/docs/api/client/resolve-react-hooks",version:"current",frontMatter:{id:"resolve-react-hooks",title:"@resolve-js/react-hooks"},sidebar:"docs",previous:{title:"@resolve-js/client",permalink:"/resolve/docs/api/client/resolve-client"},next:{title:"Request Middleware",permalink:"/resolve/docs/api/client/request-middleware"}},c=[{value:"useCommand",id:"usecommand",children:[]},{value:"useCommandBuilder",id:"usecommandbuilder",children:[]},{value:"useViewModel",id:"useviewmodel",children:[]},{value:"useQuery",id:"usequery",children:[]},{value:"useOriginResolver",id:"useoriginresolver",children:[]}],d={toc:c};function u(e){var t=e.components,n=(0,r.Z)(e,s);return(0,o.kt)("wrapper",(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"The ",(0,o.kt)("strong",{parentName:"p"},"@resolve-js/react-hooks")," library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided."),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:null},"Hook"),(0,o.kt)("th",{parentName:"tr",align:null},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usecommand"},"useCommand")),(0,o.kt)("td",{parentName:"tr",align:null},"Initializes a command that can be passed to the backend.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usecommandbuilder"},"useCommandBuilder")),(0,o.kt)("td",{parentName:"tr",align:null},"Allows a component to generate commands based on input parameters.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#useviewmodel"},"useViewModel")),(0,o.kt)("td",{parentName:"tr",align:null},"Establishes a WebSocket connection to a reSolve View Model.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#usequery"},"useQuery")),(0,o.kt)("td",{parentName:"tr",align:null},"Allows a component to send queries to a reSolve Read Model or View Model.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},(0,o.kt)("a",{parentName:"td",href:"#useoriginresolver"},"useOriginResolver")),(0,o.kt)("td",{parentName:"tr",align:null},"Resolves a relative path to an absolute URL within the application.")))),(0,o.kt)("h3",{id:"usecommand"},"useCommand"),(0,o.kt)("p",null,"Initializes a command that can be passed to the backend."),(0,o.kt)("h5",{id:"example"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const ShoppingList = ({\n  match: {\n    params: { id: aggregateId }\n  }\n}) => {\n  const renameShoppingList = useCommand({\n    type: 'renameShoppingList',\n    aggregateId,\n    aggregateName: 'ShoppingList',\n    payload: { name: shoppingList ? shoppingList.name : '' }\n  })\n\n  ...\n\n  const onShoppingListNamePressEnter = event => {\n    if (event.charCode === 13) {\n      event.preventDefault()\n      renameShoppingList()\n    }\n  }\n\n  ...\n}\n")),(0,o.kt)("h3",{id:"usecommandbuilder"},"useCommandBuilder"),(0,o.kt)("p",null,"Allows a component to generate commands based on input parameters."),(0,o.kt)("h5",{id:"example-1"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const ShoppingList = ({\n  match: {\n    params: { id: aggregateId }\n  }\n}) => {\n  const clearItemText = () => setItemText('')\n\n  const createShoppingItem = useCommandBuilder(\n    text => ({\n      type: 'createShoppingItem',\n      aggregateId,\n      aggregateName: 'ShoppingList',\n      payload: {\n        text,\n        id: Date.now().toString()\n      }\n    }),\n    clearItemText\n  )\n\n  ...\n\n  const onItemTextPressEnter = event => {\n  if (event.charCode === 13) {\n    event.preventDefault()\n    createShoppingItem(itemText)\n  }\n\n  ...\n}\n")),(0,o.kt)("h3",{id:"useviewmodel"},"useViewModel"),(0,o.kt)("p",null,"Establishes a WebSocket connection to a reSolve View Model."),(0,o.kt)("h5",{id:"example-2"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const ShoppingList = ({\n  match: {\n    params: { id: aggregateId }\n  }\n}) => {\n  const [shoppingList, setShoppingList] = useState({\n    name: '',\n    id: null,\n    list: []\n  })\n\n  const { connect, dispose } = useViewModel(\n    'shoppingList',\n    [aggregateId],\n    setShoppingList\n  )\n\n  useEffect(() => {\n    connect()\n    return () => {\n      dispose()\n    }\n  }, [])\n\n  ...\n\n  const updateShoppingListName = event => {\n    setShoppingList({ ...shoppingList, name: event.target.value })\n  }\n\n  ...\n}\n")),(0,o.kt)("h3",{id:"usequery"},"useQuery"),(0,o.kt)("p",null,"Allows a component to send queries to a reSolve Read Model or View Model."),(0,o.kt)("h5",{id:"example-3"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"const MyLists = () => {\n  const getLists = useQuery(\n    { name: 'ShoppingLists', resolver: 'all', args: {} },\n    (error, result) => {\n      setLists(result)\n    }\n  )\n\n  useEffect(() => {\n    getLists()\n  }, [])\n\n  ...\n\n  onCreateSuccess={(err, result) => {\n    const nextLists = { ...lists }\n    nextLists.data.push({\n      name: result.payload.name,\n      createdAt: result.timestamp,\n      id: result.aggregateId\n    })\n    setLists(nextLists)\n  }}\n\n  ...\n}\n")),(0,o.kt)("h3",{id:"useoriginresolver"},"useOriginResolver"),(0,o.kt)("p",null,"Resolves a relative path to an absolute URL within the application."),(0,o.kt)("h5",{id:"example-4"},"Example"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"var resolver = useOriginResolver()\nvar commandApiPath = resolver('/api/commands')\n")))}u.isMDXComponent=!0}}]);