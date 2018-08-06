pipeline {
    agent {
        docker {
            image 'reimagined/resolve-ci'
            args '-u root:root -v /home/resolve/yarn_cache:/yarn_cache -v /tmp/.X11-unix:/tmp/.X11-unix'
        }
    }
    stages {
        stage('Install') {
            steps {
                script {
                    sh """
                        export YARN_CACHE_FOLDER=/yarn_cache
                        yarn
                    """
                }
            }
        }

        stage('Checks') {
            parallel {
                stage('Prettier') {
                    steps {
                        script {
                            sh """
                                if [ "\$(node_modules/.bin/prettier --no-semi --single-quote --list-different "**/*.js")" ]; then exit 1; fi
                            """
                        }
                    }
                }
                stage('Lint') {
                    steps {
                        script {
                            sh """
                                yarn lint
                            """
                        }
                    }
                }
                stage('Unit tests') {
                    steps {
                        script {
                            sh """
                                yarn test
                            """
                        }
                    }
                }
            }
        }

        stage('Functional tests') {
            when {
                expression { CHANGE_TARGET != 'master' }
            }
            steps {
                script {
                    sh """
                        export DISPLAY=:0;
                        firefox && echo 'err';

                        npx oao run-script test:functional -- --browser=path:/chromium
                    """
                }
            }
        }

        stage('Publish canary') {
            when {
                expression { CHANGE_TARGET == 'master' }
            }
            steps {
                script {
                    env.CI_TIMESTAMP = (new Date()).format("MddHHmmss", TimeZone.getTimeZone('UTC'))
                    env.CI_RELEASE_TYPE = 'alpha'

                    sh """
                        export YARN_CACHE_FOLDER=/yarn_cache

                        git log | head -1 | awk '{ print \$2 }' > /last_commit
                        echo \$(cat /last_commit)

                        export CI_CANARY_VERSION=\$(nodejs -e "console.log(JSON.parse(require('fs').readFileSync('./package.json')).version.split('-')[0].split('.').map((ver, idx) => (idx < 2 ? ver : String(+ver + 1) )).join('.'));")-${env.CI_TIMESTAMP}.${env.CI_RELEASE_TYPE}; \
                        echo \$CI_CANARY_VERSION > /lerna_version; \

                        yarn oao --version;

                        echo 'registry "http://${env.NPM_ADDR}"' >> /root/.yarnrc; \
                        npm set registry=http://${env.NPM_ADDR}; \
                        cat /root/.yarnrc; \
                        cat /ver.ver; \
                        find . -name package.json -type f -print | grep -v node_modules | xargs -I '%' node -e 'require("fs").writeFileSync(process.argv[1], JSON.stringify((() => { const pj = require(process.argv[1]); if(pj.dependencies) Object.keys(pj.dependencies).forEach(key => { if(key.indexOf("resolve-") < 0) return; pj.dependencies[key] = process.env.CI_CANARY_VERSION  }); return pj; })(), null, 3))' '%'; \
                        yarn run publish --no-checks --no-confirm --new-version \$(cat /lerna_version); \
                        sleep 10
                    """
                }
            }
        }

        stage('Prepare for [ create-resolve-app ] testing') {
            when {
                expression { CHANGE_TARGET == 'master' }
            }
            steps {
                script {
                    sh """
                        rm -rf ./*
                        export YARN_CACHE_FOLDER=/yarn_cache

                        yarn global add create-resolve-app@\$(cat /lerna_version)
                    """
                }
            }
        }

        stage('CRA tests') {
            when {
                expression { CHANGE_TARGET == 'master' }
            }
            parallel {
                stage('Create-resolve-app [ hello-world ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir hello-world && cd hello-world;
                                create-resolve-app hello-world -c \$(cat /last_commit)
                                cd ./hello-world; \
                                cat ./package.json; \
                                sed -i 's/"port": 3000/"port": 3001/g' ./resolve.config.json;
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3001/g'

                                yarn test
                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ todolist ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir todolist && cd todolist;
                                create-resolve-app todolist -e todo -c \$(cat /last_commit)
                                cd ./todolist
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3002/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3002/g'

                                yarn test
                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ twolevelstodo ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir twolevelstodo && cd twolevelstodo;
                                create-resolve-app twolevelstodo -e todo-two-levels -c \$(cat /last_commit)
                                cd ./twolevelstodo
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3003/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3003/g'

                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ hacker-news ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir hacker-news && cd hacker-news;
                                create-resolve-app hn -e hacker-news -c \$(cat /last_commit)
                                cd ./hn
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3004/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3004/g'

                                yarn test
                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ top-list ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir top-list && cd top-list;
                                create-resolve-app toplist -e top-list -c \$(cat /last_commit)
                                cd ./toplist
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3005/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3005/g'


                                yarn test
                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ with-postcss ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir with-postcss && cd with-postcss;
                                create-resolve-app with-postcss -e with-postcss -c \$(cat /last_commit)
                                cd ./with-postcss
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3006/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3006/g'

                                yarn test
                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ with-authentication ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir with-authentication && cd with-authentication;
                                create-resolve-app with-authentication -e with-authentication -c \$(cat /last_commit)
                                cd ./with-authentication
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3007/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3007/g'

                                yarn test
                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ with-styled-components ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir with-styled-components && cd with-styled-components;
                                create-resolve-app with-styled-components -e with-styled-components -c \$(cat /last_commit)
                                cd ./with-styled-components
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3008/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3008/g'

                                yarn test
                                yarn test:functional --browser=path:/chromium
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                sh 'rm -rf ./*'
            }

            deleteDir()
        }
    }
}

// LINKS:

// https://github.com/DevExpress/XAF2/tree/devops/node-testcafe
// https://hub.docker.com/r/reimagined/node-testcafe/

// https://github.com/DevExpress/XAF2/tree/devops/next-lerna-version
