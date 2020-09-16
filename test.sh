test_app_dir=$(mktemp -d -t test-app-XXXXXXXXX)
echo "::set-env name=test_app_dir::${test_app_dir}"
cp -rf ./functional-tests/app/* ${test_app_dir}
echo "installing test app packages"
cd ${test_app_dir}
rm -rf node_modules
yarn