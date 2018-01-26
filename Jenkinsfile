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
                    sh 'yarn install'
                    sh 'yarn run bootstrap'
                    sh 'yarn run lint'
                    sh 'yarn test -- --stream'
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
                            echo registry=https://${env.NPM_ADDR_REMOTE} > /root/.npmrc; \
                            echo //${env.NPM_ADDR_REMOTE}/:_authToken=${env.NPM_TOKEN_REMOTE} >> /root/.npmrc; \
                            ./node_modules/.bin/lerna publish --canary --skip-git --force-publish=* --yes --repo-version \$(cat /lerna_version); \
                        """
                    }

                    sh """
                        echo registry=http://${env.NPM_ADDR} > /root/.npmrc; \
                        echo //${env.NPM_ADDR}/:_authToken=${env.NPM_TOKEN} >> /root/.npmrc; \
                        ./node_modules/.bin/lerna publish --skip-git --force-publish=* --yes --repo-version \$(cat /lerna_version); \
                        sleep 10
                    """
                }
            }
        }
        
        stage('Examples [ todo ] Functional Tests') {
            steps {
                script {
                    sh """
                        /init.sh
                        cd examples/todo
                        yarn install
                        yarn run update \$(cat /lerna_version)
                        cat ./package.json
                        yarn run test:functional -- --browser=path:/chromium
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
                        yarn install
                        yarn run update \$(cat /lerna_version)
                        cat ./package.json
                        yarn run test:functional -- --browser=path:/chromium
                    """
                }
            }
        }

        stage('Create-resolve-app [ empty ] Functional Tests') {
            steps {
                script {
                    sh """
                        /init.sh
                        yarn install -g create-resolve-app@\$(cat /lerna_version)
                        create-resolve-app empty
                        cd ./empty
                        yarn run flow
                        yarn run test
                        yarn run test:functional -- --browser=path:/chromium
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
                        yarn run flow
                        yarn run test
                        yarn run test:functional -- --browser=path:/chromium
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
                        yarn install
                        ./node_modules/.bin/resolve-scripts update \$(cat /lerna_version)
                        yarn run build
                        testcafe path:/chromium ./tests/functional --app "IS_TEST=true yarn run start"
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
