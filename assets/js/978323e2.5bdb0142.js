"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[8690],{4272:(e,t,n)=>{n.r(t),n.d(t,{frontMatter:()=>s,contentTitle:()=>i,metadata:()=>p,toc:()=>c,default:()=>u});var a=n(2685),r=n(1244),l=(n(7378),n(5318)),o=["components"],s={id:"resolve-react-hooks",title:"@resolve-js/react-hooks",description:"The @resolve-js/react-hooks library exposes React hooks that you can use to connect React components to a reSolve backend."},i=void 0,p={unversionedId:"api/client/resolve-react-hooks",id:"api/client/resolve-react-hooks",isDocsHomePage:!1,title:"@resolve-js/react-hooks",description:"The @resolve-js/react-hooks library exposes React hooks that you can use to connect React components to a reSolve backend.",source:"@site/../docs/api/client/resolve-react-hooks.md",sourceDirName:"api/client",slug:"/api/client/resolve-react-hooks",permalink:"/resolve/docs/api/client/resolve-react-hooks",tags:[],version:"current",frontMatter:{id:"resolve-react-hooks",title:"@resolve-js/react-hooks",description:"The @resolve-js/react-hooks library exposes React hooks that you can use to connect React components to a reSolve backend."},sidebar:"docs",previous:{title:"@resolve-js/client",permalink:"/resolve/docs/api/client/resolve-client"},next:{title:"Request Middleware",permalink:"/resolve/docs/api/client/request-middleware"}},c=[{value:"<code>useClient</code>",id:"useclient",children:[{value:"Example",id:"example",children:[],level:4}],level:3},{value:"<code>useCommand</code>",id:"usecommand",children:[{value:"Example",id:"example-1",children:[],level:4}],level:3},{value:"<code>useCommandBuilder</code>",id:"usecommandbuilder",children:[{value:"Example",id:"example-2",children:[],level:4}],level:3},{value:"<code>useViewModel</code>",id:"useviewmodel",children:[{value:"Example",id:"example-3",children:[],level:4}],level:3},{value:"<code>useQuery</code>",id:"usequery",children:[{value:"Example",id:"example-4",children:[],level:4}],level:3},{value:"<code>useQueryBuilder</code>",id:"usequerybuilder",children:[{value:"Example",id:"example-5",children:[],level:4}],level:3},{value:"<code>useOriginResolver</code>",id:"useoriginresolver",children:[{value:"Example",id:"example-6",children:[],level:4}],level:3},{value:"<code>useStaticResolver</code>",id:"usestaticresolver",children:[],level:3}],d={toc:c};function u(e){var t=e.components,n=(0,r.Z)(e,o);return(0,l.kt)("wrapper",(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("p",null,"The ",(0,l.kt)("strong",{parentName:"p"},"@resolve-js/react-hooks")," library exposes React hooks that you can use to connect React components to a reSolve backend. The following hooks are included:"),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Hook"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#useclient"},(0,l.kt)("inlineCode",{parentName:"a"},"useClient"))),(0,l.kt)("td",{parentName:"tr",align:null},"Returns the ",(0,l.kt)("a",{parentName:"td",href:"/resolve/docs/api/client/resolve-client"},"@resolve-js/client")," library's ",(0,l.kt)("inlineCode",{parentName:"td"},"client")," object.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#usecommand"},(0,l.kt)("inlineCode",{parentName:"a"},"useCommand"))),(0,l.kt)("td",{parentName:"tr",align:null},"Initializes a command that can be passed to the backend.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#usecommandbuilder"},(0,l.kt)("inlineCode",{parentName:"a"},"useCommandBuilder"))),(0,l.kt)("td",{parentName:"tr",align:null},"Allows a component to generate commands based on input parameters.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#useviewmodel"},(0,l.kt)("inlineCode",{parentName:"a"},"useViewModel"))),(0,l.kt)("td",{parentName:"tr",align:null},"Establishes a WebSocket connection to a reSolve View Model.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#usequery"},(0,l.kt)("inlineCode",{parentName:"a"},"useQuery"))),(0,l.kt)("td",{parentName:"tr",align:null},"Allows a component to send queries to a reSolve Read Model or View Model.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#usequerybuilder"},(0,l.kt)("inlineCode",{parentName:"a"},"useQueryBuilder"))),(0,l.kt)("td",{parentName:"tr",align:null},"Allows a component to generate queries based on input parameters.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#useoriginresolver"},(0,l.kt)("inlineCode",{parentName:"a"},"useOriginResolver"))),(0,l.kt)("td",{parentName:"tr",align:null},"Resolves a relative path to an absolute URL within the application.")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"#usestaticresolver"},(0,l.kt)("inlineCode",{parentName:"a"},"useStaticResolver"))),(0,l.kt)("td",{parentName:"tr",align:null},"Resolves a relative path to a static resource's full URL.")))),(0,l.kt)("h3",{id:"useclient"},(0,l.kt)("inlineCode",{parentName:"h3"},"useClient")),(0,l.kt)("p",null,"Returns the ",(0,l.kt)("a",{parentName:"p",href:"/resolve/docs/api/client/resolve-client"},"@resolve-js/client")," library's ",(0,l.kt)("inlineCode",{parentName:"p"},"client")," object."),(0,l.kt)("h4",{id:"example"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"const client = useClient()\n\nclient.command(\n  {\n    aggregateName: 'Chat',\n    type: 'postMessage',\n    aggregateId: userName,\n    payload: message,\n  },\n  (err) => {\n    if (err) {\n      console.warn(`Error while sending command: ${err}`)\n    }\n  }\n)\n")),(0,l.kt)("h3",{id:"usecommand"},(0,l.kt)("inlineCode",{parentName:"h3"},"useCommand")),(0,l.kt)("p",null,"Initializes a command that can be passed to the backend."),(0,l.kt)("h4",{id:"example-1"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"const ShoppingList = ({\n  match: {\n    params: { id: aggregateId }\n  }\n}) => {\n  const renameShoppingList = useCommand({\n    type: 'renameShoppingList',\n    aggregateId,\n    aggregateName: 'ShoppingList',\n    payload: { name: shoppingList ? shoppingList.name : '' }\n  })\n\n  ...\n\n  const onShoppingListNamePressEnter = event => {\n    if (event.charCode === 13) {\n      event.preventDefault()\n      renameShoppingList()\n    }\n  }\n\n  ...\n}\n")),(0,l.kt)("h3",{id:"usecommandbuilder"},(0,l.kt)("inlineCode",{parentName:"h3"},"useCommandBuilder")),(0,l.kt)("p",null,"Allows a component to generate commands based on input parameters."),(0,l.kt)("h4",{id:"example-2"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"const ShoppingList = ({\n  match: {\n    params: { id: aggregateId }\n  }\n}) => {\n  const clearItemText = () => setItemText('')\n\n  const createShoppingItem = useCommandBuilder(\n    text => ({\n      type: 'createShoppingItem',\n      aggregateId,\n      aggregateName: 'ShoppingList',\n      payload: {\n        text,\n        id: Date.now().toString()\n      }\n    }),\n    clearItemText\n  )\n\n  ...\n\n  const onItemTextPressEnter = event => {\n  if (event.charCode === 13) {\n    event.preventDefault()\n    createShoppingItem(itemText)\n  }\n\n  ...\n}\n")),(0,l.kt)("h3",{id:"useviewmodel"},(0,l.kt)("inlineCode",{parentName:"h3"},"useViewModel")),(0,l.kt)("p",null,"Establishes a WebSocket connection to a reSolve View Model."),(0,l.kt)("h4",{id:"example-3"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"const ShoppingList = ({\n  match: {\n    params: { id: aggregateId }\n  }\n}) => {\n  const [shoppingList, setShoppingList] = useState({\n    name: '',\n    id: null,\n    list: []\n  })\n\n  const { connect, dispose } = useViewModel(\n    'shoppingList',\n    [aggregateId],\n    setShoppingList\n  )\n\n  useEffect(() => {\n    connect()\n    return () => {\n      dispose()\n    }\n  }, [])\n\n  ...\n\n  const updateShoppingListName = event => {\n    setShoppingList({ ...shoppingList, name: event.target.value })\n  }\n\n  ...\n}\n")),(0,l.kt)("h3",{id:"usequery"},(0,l.kt)("inlineCode",{parentName:"h3"},"useQuery")),(0,l.kt)("p",null,"Allows a component to send queries to a reSolve Read Model or View Model."),(0,l.kt)("h4",{id:"example-4"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"const MyLists = () => {\n  const getLists = useQuery(\n    { name: 'ShoppingLists', resolver: 'all', args: {} },\n    (error, result) => {\n      setLists(result)\n    }\n  )\n\n  useEffect(() => {\n    getLists()\n  }, [])\n\n  ...\n}\n")),(0,l.kt)("h3",{id:"usequerybuilder"},(0,l.kt)("inlineCode",{parentName:"h3"},"useQueryBuilder")),(0,l.kt)("p",null,"Allows a component to generate queries based on input parameters."),(0,l.kt)("h4",{id:"example-5"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"const getPage = useQueryBuilder(\n  (page) => ({\n    name: 'MessageList',\n    resolver: 'paginated',\n    args: { page },\n  }),\n  (error, result) => {\n    setMessages(result.data)\n  }\n)\n\nuseEffect(() => {\n  getPage(page)\n}, [])\n")),(0,l.kt)("h3",{id:"useoriginresolver"},(0,l.kt)("inlineCode",{parentName:"h3"},"useOriginResolver")),(0,l.kt)("p",null,"Resolves a relative path to an absolute URL within the application."),(0,l.kt)("h4",{id:"example-6"},"Example"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"var resolver = useOriginResolver()\nvar commandApiPath = resolver('/api/commands')\n")),(0,l.kt)("h3",{id:"usestaticresolver"},(0,l.kt)("inlineCode",{parentName:"h3"},"useStaticResolver")),(0,l.kt)("p",null,"Resolves a relative path to a static resource's full URL."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"var staticResolver = useStaticResolver()\nvar imagePath = staticResolver('/account/image.jpg')\n")))}u.isMDXComponent=!0},5318:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>m});var a=n(7378);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),p=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},c=function(e){var t=p(e.components);return a.createElement(i.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,l=e.originalType,i=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),u=p(n),m=r,g=u["".concat(i,".").concat(m)]||u[m]||d[m]||l;return n?a.createElement(g,o(o({ref:t},c),{},{components:n})):a.createElement(g,o({ref:t},c))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=n.length,o=new Array(l);o[0]=u;var s={};for(var i in t)hasOwnProperty.call(t,i)&&(s[i]=t[i]);s.originalType=e,s.mdxType="string"==typeof e?e:r,o[1]=s;for(var p=2;p<l;p++)o[p]=n[p];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"}}]);