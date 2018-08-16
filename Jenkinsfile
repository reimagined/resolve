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

                        npx oao run-script test:functional
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

       stage('NPM. Create-resolve-app [ hello-world ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir npm-hello-world && cd hello-world;
                            npx create-resolve-app npm-hello-world -c \$(cat /last_commit)
                            cd ./npm-hello-world; 
                            cat ./package.json; 
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('NPM. Create-resolve-app [ nested-list ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir npm-nested-list && cd nested-list;
                            npx create-resolve-app npm-nested-list -e nested-list -c \$(cat /last_commit)
                            cd ./npm-nested-list
                            cat ./package.json
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('NPM. Create-resolve-app [ hacker-news ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir npm-hacker-news && cd hacker-news;
                            npx create-resolve-app npm-hacker-news -e hacker-news -c \$(cat /last_commit)
                            cd ./npm-hacker-news
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('NPM. Create-resolve-app [ with-postcss ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir npm-with-postcss && cd with-postcss;
                            npx create-resolve-app npm-with-postcss -e with-postcss -c \$(cat /last_commit)
                            cd ./npm-with-postcss
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('NPM. Create-resolve-app [ with-styled-components ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir npm-with-styled-components && cd with-styled-components;
                            npx create-resolve-app npm-with-styled-components -e with-styled-components -c \$(cat /last_commit)
                            cd ./npm-with-styled-components
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }
            
            stage('NPM. Create-resolve-app [ with-saga ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir npm-with-saga && cd with-saga;
                            npx create-resolve-app npm-with-saga -e with-saga -c \$(cat /last_commit)
                            cd ./npm-with-saga
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('Yarn. Create-resolve-app [ hello-world ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir yarn-hello-world && cd hello-world;
                            yarn create-resolve-app yarn-hello-world -c \$(cat /last_commit)
                            cd ./yarn-hello-world; 
                            cat ./package.json; 
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('Yarn. Create-resolve-app [ nested-list ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir yarn-nested-list && cd nested-list;
                            yarn create-resolve-app yarn-nested-list -e nested-list -c \$(cat /last_commit)
                            cd ./yarn-nested-list
                            cat ./package.json
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('Yarn. Create-resolve-app [ hacker-news ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir yarn-hacker-news && cd hacker-news;
                            yarn create-resolve-app yarn-hacker-news -e hacker-news -c \$(cat /last_commit)
                            cd ./yarn-hacker-news
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('Yarn. Create-resolve-app [ with-postcss ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir yarn-with-postcss && cd with-postcss;
                            yarn create-resolve-app yarn-with-postcss -e with-postcss -c \$(cat /last_commit)
                            cd ./yarn-with-postcss
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }

            stage('Yarn. Create-resolve-app [ with-styled-components ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir yarn-with-styled-components && cd with-styled-components;
                            yarn create-resolve-app yarn-with-styled-components -e with-styled-components -c \$(cat /last_commit)
                            cd ./yarn-with-styled-components
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
                        """
                    }
                }
            }
            
            stage('Yarn. Create-resolve-app [ with-saga ] Functional Tests') {
                 when {
                expression { CHANGE_TARGET == 'master' }
            }
                steps {
                    script {
                        sh """
                            mkdir yarn-with-saga && cd with-saga;
                            yarn create-resolve-app yarn-with-saga -e with-saga -c \$(cat /last_commit)
                            cd ./yarn-with-saga
                            cat ./package.json
                            yarn test
                            yarn test:functional path:/chromium
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
