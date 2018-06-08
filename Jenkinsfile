pipeline {
    agent {
        docker {
            image 'reimagined/resolve-ci'
            args '-u root:root -v /home/resolve/yarn_cache:/yarn_cache -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=$DISPLAY'
        }
    }
    stages {
        stage('Unit tests') {
            steps {
                script {
                    sh """
                        export YARN_CACHE_FOLDER=/yarn_cache
                        yarn install --dev
                    """
                }
            }
        }

        stage('Publish canary') {
            steps {
                script {
                    env.CI_TIMESTAMP = (new Date()).format("MddHHmmss", TimeZone.getTimeZone('UTC'))
                    if (env.BRANCH_NAME =~ '^v([0-9]+).([0-9]+).([0-9]+)$') {
                        env.CI_RELEASE_TYPE = 'beta'
                    } else {
                        env.CI_RELEASE_TYPE = 'alpha'
                    }

                    sh """
                        export YARN_CACHE_FOLDER=/yarn_cache

                        git log | head -1 | awk '{ print \$2 }' > /last_commit
                        echo \$(cat /last_commit)

                        export CI_CANARY_VERSION=\$(nodejs -e "console.log(JSON.parse(require('fs').readFileSync('./package.json')).version.split('-')[0].split('.').map((ver, idx) => (idx < 2 ? ver : String(+ver + 1) )).join('.'));")-${env.CI_TIMESTAMP}.${env.CI_RELEASE_TYPE}; \
                        echo \$CI_CANARY_VERSION > /lerna_version; \

                        yarn oao --version;

                        echo "#!/usr/bin/expect" > /npmlogin.sh; \
                        echo 'set timeout 1;spawn npm login;expect "Username: ";send "${env.NPM_USER}\\\\r";expect "Password: (<default hidden>)";send "1\\\\r";send "${env.NPM_EMAIL}\\\\r";send "1\\\\r";interact ' >> /npmlogin.sh;

                        echo 'registry "http://${env.NPM_ADDR}"' >> /root/.yarnrc; \
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


                stage('Create-resolve-app [ hello-world ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir hw && cd hw; \
                                create-resolve-app hello-world -c \$(cat /last_commit)
                                cd ./hello-world; \
                                cat ./package.json; \
                                sed -i 's/"port": 3000/"port": 3001/g' ./resolve.config.json;
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3001/g'

                                yarn test
                                yarn test:functional --browser=firefox
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ todolist ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir tl && cd tl
                                create-resolve-app todolist -e todo -c \$(cat /last_commit)
                                cd ./todolist
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3002/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3002/g'

                                yarn test
                                yarn test:functional --browser=firefox
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ twolevelstodo ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir tltl && cd tltl
                                create-resolve-app twolevelstodo -e todo-two-levels -c \$(cat /last_commit)
                                cd ./twolevelstodo
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3003/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3003/g'

                                yarn test
                                yarn test:functional --browser=firefox
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ hacker-news ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir hn && cd hn
                                create-resolve-app hn -e hacker-news -c \$(cat /last_commit)
                                cd ./hn
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3004/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3004/g'

                                yarn test
                                yarn test:functional --browser=firefox
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ top-list ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir topl && cd topl
                                create-resolve-app toplist -e top-list -c \$(cat /last_commit)
                                cd ./toplist
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3005/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3005/g'


                                yarn test
                                yarn test:functional --browser=firefox
                            """
                        }
                    }
                }

                stage('Create-resolve-app [ with-postcss-modules ] Functional Tests') {
                    steps {
                        script {
                            sh """
                                mkdir wpc && cd wpc
                                create-resolve-app with-postcss-modules -e with-postcss-modules -c \$(cat /last_commit)
                                cd ./with-postcss-modules
                                cat ./package.json
                                sed -i 's/"port": 3000/"port": 3006/g' ./resolve.config.json
                                grep -rl 3000 ./test/functional/ | xargs sed -i 's/3000/3006/g'

                                yarn test
                                yarn test:functional --browser=firefox
                            """
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
