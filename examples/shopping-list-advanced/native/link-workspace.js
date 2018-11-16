const fs = require('fs-extra');
const path = require('path');
const { getModulesDirs } = require('resolve-scripts')

const link = (name, fromBase) => {


  // /home/mrcheater/resolve/examples/shopping-list-advanced/native/node_modules/expo/build/Expo.js
  // /home/mrcheater/resolve/examples/shopping-list-advanced/native/node_modules/react-native/Libraries/react-native/react-native-implementation.js
  //
  

  const from = path.dirname(require.resolve(name + '/package.json', { paths: getModulesDirs() }))
  


  const to = path.join(__dirname, 'node_modules', name);
  
  console.log(from, ' -> ', to)

  if (fs.existsSync(to)) {
    try {
      fs.removeSync(to);
    } catch (e) {
      console.warn(e)
    }
  }
  
  try {
    fs.symlinkSync(from, to, 'dir');
  } catch (e) {
    console.warn(e)
  }
};

  
link('expo');
link('react-native');



