pipeline {
    agent {
        docker { 
            image 'reimagined/resolve-ci' 
            args '-u root:root'
        }
    }
    stages {
        stage('Unit tests') {
            steps {
                script {
                    sh 'npm install'
                    sh 'if [ "$(node_modules/.bin/prettier-eslint "./**/src/**/*.js" "./**/test/**/*.js" --list-different --ignore=./**/node_modules/**)" ]; then exit 1; fi'
                    sh 'npm run bootstrap'
                    sh 'npm run lint'
                    sh 'npm test -- --stream'
                }
            }
        }

        stage('Publish canary') {
            steps {
                script {
                    env.CI_TIMESTAMP = (new Date()).format("MMddHHmmss", TimeZone.getTimeZone('UTC'))
                    if (env.BRANCH_NAME =~ '^v([0-9]+).([0-9]+).([0-9]+)$') {
                        env.CI_RELEASE_TYPE = 'beta'
                    } else {
                        env.CI_RELEASE_TYPE = 'alpha'
                    }

                    sh """
                        eval \$(next-lerna-version); \
                        export CI_CANARY_VERSION=\$NEXT_LERNA_VERSION-${env.CI_TIMESTAMP}.${env.CI_RELEASE_TYPE}; \
                        echo \$CI_CANARY_VERSION > /lerna_version; \
                    """

                    if ( env.CI_RELEASE_TYPE == 'beta' ) {
                        sh """
                            echo //${env.NPM_ADDR_REMOTE}/:_authToken=${env.NPM_TOKEN_REMOTE} >> /root/.npmrc; \
                            ./node_modules/.bin/lerna publish --canary --skip-git --force-publish=* --yes --repo-version \$(cat /lerna_version); \
                            sleep 10
                        """
                    } else {
                        sh """
                            echo //${env.NPM_ADDR}/:_authToken=${env.NPM_TOKEN} >> /root/.npmrc; \
                            ./node_modules/.bin/lerna publish --skip-git --force-publish=* --yes --repo-version \$(cat /lerna_version); \
                            sleep 10
                        """
                    }
                }
            }
        }
        
        stage('Examples [ todo ] Functional Tests') {
            steps {
                script {
                    sh """
                        /init.sh
                        cd examples/todo
                        npm install
                        npm run update \$(cat /lerna_version)
                        cat ./package.json
                        npm run test:functional -- --browser=path:/chromium
                    """
                }
            }
        }

        stage('Examples [ todo-two-levels ] Functional Tests') {
            steps {
                script {
                    sh """
                        /init.sh
                        cd examples/todo-two-levels
                        npm install
                        npm run update \$(cat /lerna_version)
                        cat ./package.json
                        npm run test:functional -- --browser=path:/chromium
                    """
                }
            }
        }

        stage('Create-resolve-app [ empty ] Functional Tests') {
            steps {
                script {
                    sh """
                        /init.sh
                        npm install -g create-resolve-app@\$(cat /lerna_version)
                        create-resolve-app empty
                        cd ./empty
                        npm run flow
                        npm run test
                        npm run test:functional -- --browser=path:/chromium
                    """
                }
            }
        }

        stage('Create-resolve-app [ todolist ] Functional Tests') {
            steps {
                script {
                    sh """
                        /init.sh
                        create-resolve-app --sample todolist
                        cd ./todolist
                        npm run flow
                        npm run test
                        npm run test:functional -- --browser=path:/chromium
                    """
                }
            }
        }

        stage('Resolve/HackerNews Functional Tests') {
            steps {
                script {
                    sh """
                        /init.sh
                        git clone https://github.com/reimagined/hacker-news-resolve.git
                        cd hacker-news-resolve
                        git checkout ${env.BRANCH_NAME} || echo "No branch \"${env.BRANCH_NAME}\""
                        npm install
                        ./node_modules/.bin/resolve-scripts update \$(cat /lerna_version)
                        npm run build
                        testcafe path:/chromium ./tests/functional --app "IS_TEST=true npm run start"
                    """
                }
            }
        }

        stage('Resolve/Apps Functional Tests (only PR release/x.y.z => master)') {
            steps {
                script {
                    if(env.BRANCH_NAME.contains('release')) {
                        withCredentials([
                            string(credentialsId: 'DEPENDENT_JOBS_LIST', variable: 'JOBS')
                        ]) {
                            def jobs = env.JOBS.split(';')
                            for (def i = 0; i < jobs.length; ++i) {
                                build([
                                    job: jobs[i],
                                    parameters: [[
                                        $class: 'StringParameterValue',
                                        name: 'NPM_CANARY_VERSION',
                                        value: env.CI_TIMESTAMP
                                    ],[
                                        $class: 'BooleanParameterValue',
                                        name: 'RESOLVE_CHECK',
                                        value: true
                                    ]]
                                ])
                            }
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
