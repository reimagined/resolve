
import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';
export default [
{
  path: '/resolve/',
  component: ComponentCreator('/resolve/','dee'),
  exact: true,
},
{
  path: '/resolve/__docusaurus/debug',
  component: ComponentCreator('/resolve/__docusaurus/debug','2a1'),
  exact: true,
},
{
  path: '/resolve/__docusaurus/debug/config',
  component: ComponentCreator('/resolve/__docusaurus/debug/config','a1d'),
  exact: true,
},
{
  path: '/resolve/__docusaurus/debug/content',
  component: ComponentCreator('/resolve/__docusaurus/debug/content','392'),
  exact: true,
},
{
  path: '/resolve/__docusaurus/debug/globalData',
  component: ComponentCreator('/resolve/__docusaurus/debug/globalData','d13'),
  exact: true,
},
{
  path: '/resolve/__docusaurus/debug/metadata',
  component: ComponentCreator('/resolve/__docusaurus/debug/metadata','3f6'),
  exact: true,
},
{
  path: '/resolve/__docusaurus/debug/registry',
  component: ComponentCreator('/resolve/__docusaurus/debug/registry','0ce'),
  exact: true,
},
{
  path: '/resolve/__docusaurus/debug/routes',
  component: ComponentCreator('/resolve/__docusaurus/debug/routes','d37'),
  exact: true,
},
{
  path: '/resolve/blog',
  component: ComponentCreator('/resolve/blog','bed'),
  exact: true,
},
{
  path: '/resolve/blog/2018/12/05/welcome',
  component: ComponentCreator('/resolve/blog/2018/12/05/welcome','211'),
  exact: true,
},
{
  path: '/resolve/search',
  component: ComponentCreator('/resolve/search','900'),
  exact: true,
},
{
  path: '/resolve/docs',
  component: ComponentCreator('/resolve/docs','66f'),
  
  routes: [
{
  path: '/resolve/docs/',
  component: ComponentCreator('/resolve/docs/','4f4'),
  exact: true,
},
{
  path: '/resolve/docs/advanced-techniques',
  component: ComponentCreator('/resolve/docs/advanced-techniques','6bf'),
  exact: true,
},
{
  path: '/resolve/docs/api-handlers',
  component: ComponentCreator('/resolve/docs/api-handlers','7e7'),
  exact: true,
},
{
  path: '/resolve/docs/api-reference',
  component: ComponentCreator('/resolve/docs/api-reference','fd7'),
  exact: true,
},
{
  path: '/resolve/docs/app-structure',
  component: ComponentCreator('/resolve/docs/app-structure','d29'),
  exact: true,
},
{
  path: '/resolve/docs/application-configuration',
  component: ComponentCreator('/resolve/docs/application-configuration','fd4'),
  exact: true,
},
{
  path: '/resolve/docs/authentication-and-authorization',
  component: ComponentCreator('/resolve/docs/authentication-and-authorization','e16'),
  exact: true,
},
{
  path: '/resolve/docs/contributing',
  component: ComponentCreator('/resolve/docs/contributing','dcc'),
  exact: true,
},
{
  path: '/resolve/docs/debugging',
  component: ComponentCreator('/resolve/docs/debugging','be8'),
  exact: true,
},
{
  path: '/resolve/docs/faq',
  component: ComponentCreator('/resolve/docs/faq','9c8'),
  exact: true,
},
{
  path: '/resolve/docs/frontend',
  component: ComponentCreator('/resolve/docs/frontend','ba9'),
  exact: true,
},
{
  path: '/resolve/docs/introduction',
  component: ComponentCreator('/resolve/docs/introduction','fdf'),
  exact: true,
},
{
  path: '/resolve/docs/manage-application',
  component: ComponentCreator('/resolve/docs/manage-application','26a'),
  exact: true,
},
{
  path: '/resolve/docs/preparing-to-production',
  component: ComponentCreator('/resolve/docs/preparing-to-production','123'),
  exact: true,
},
{
  path: '/resolve/docs/read-side',
  component: ComponentCreator('/resolve/docs/read-side','0d6'),
  exact: true,
},
{
  path: '/resolve/docs/sagas',
  component: ComponentCreator('/resolve/docs/sagas','e83'),
  exact: true,
},
{
  path: '/resolve/docs/testing',
  component: ComponentCreator('/resolve/docs/testing','624'),
  exact: true,
},
{
  path: '/resolve/docs/troubleshooting',
  component: ComponentCreator('/resolve/docs/troubleshooting','aa2'),
  exact: true,
},
{
  path: '/resolve/docs/tutorial',
  component: ComponentCreator('/resolve/docs/tutorial','031'),
  exact: true,
},
{
  path: '/resolve/docs/write-side',
  component: ComponentCreator('/resolve/docs/write-side','cc4'),
  exact: true,
},
]
},
{
  path: '*',
  component: ComponentCreator('*')
}
];
