pipeline {
    agent {
        docker { image 'reimagined/node-testcafe' }
    }
    stages {
        stage('Unit tests') {
            steps {
                script {
                    sh 'npm install'
                    sh 'if [ "$(node_modules/.bin/prettier-eslint "./**/src/**/*.js" "./**/test/**/*.js" --list-different --ignore=./node_modules/**)" ]; then exit 1; fi'
                    sh 'npm run bootstrap'
                    sh 'npm run lint'
                    sh 'npm test'
                }
            }
        }

        stage('Publish alpha') {
            steps {
                script {
                    def credentials = [
                        string(credentialsId: 'NPM_CREDENTIALS', variable: 'NPM_TOKEN')
                    ];

                    withCredentials(credentials) {
                        env.NPM_ADDR = 'registry.npmjs.org'

                        env.CI_TIMESTAMP = (new Date()).format("MMddHHmmss", TimeZone.getTimeZone('UTC'))

                        sh """
                            npm config set //${env.NPM_ADDR}/:_authToken ${env.NPM_TOKEN}
                            npm whoami
                            eval \$(next-lerna-version); \
                            export CI_ALPHA_VERSION=\$NEXT_LERNA_VERSION-alpha.${env.CI_TIMESTAMP}; \
                            ./node_modules/.bin/lerna publish --skip-git --force-publish=* --yes --repo-version \$CI_ALPHA_VERSION --canary
                        """
                    }

                }
            }
        }

        stage('Create-resolve-app [ todolist ] Functional Tests') {
            steps {
                script {
                    sh """
                        /prepare-chromium.sh

                        eval \$(next-lerna-version)
                        export CI_ALPHA_VERSION=\$NEXT_LERNA_VERSION-alpha.${env.CI_TIMESTAMP}


                        while :
                        do
                            if ( npm install -g create-resolve-app@\$CI_ALPHA_VERSION ); then
                                break
                            else
                                sleep 5
                            fi
                        done

                        create-resolve-app --sample todolist
                        cd ./todolist

                        npm run test:e2e -- --browser=path:/chromium
                    """
                }
            }
        }

        stage('Resolve/HackerNews Functional Tests') {
            steps {
                script {
                    sh """
                        /prepare-chromium.sh

                        eval \$(next-lerna-version)
                        export CI_ALPHA_VERSION=\$NEXT_LERNA_VERSION-alpha.${env.CI_TIMESTAMP}

                        git clone https://github.com/reimagined/hacker-news-resolve.git

                        cd hacker-news-resolve

                        npm install -g resolve-scripts@\$CI_ALPHA_VERSION
                        npm install
                        resolve-scripts update \$CI_ALPHA_VERSION

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
            deleteDir()
        }
    }
}

// LINKS:

// https://github.com/DevExpress/XAF2/tree/devops/node-testcafe
// https://hub.docker.com/r/reimagined/node-testcafe/

// https://github.com/DevExpress/XAF2/tree/devops/next-lerna-version
