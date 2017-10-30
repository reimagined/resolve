pipeline {
    agent any
    stages {
        stage('Unit tests') {
            steps {
                script {
                    docker.image('node:8').inside {
                        sh 'npm install'
                        sh 'npm run bootstrap'
                    }
                }
            }
        }


        stage('Publish alpha') {
            steps {
                script {
                    def credentials = [
                        string(credentialsId: 'NPM_CREDENTIALS', variable: 'NPM_TOKEN')
                    ];

                    docker.image('node:8').inside {
                        withCredentials(credentials) {
                            sh "npm install -g next-lerna-version"

                            env.NPM_ADDR = 'registry.npmjs.org'

                            env.CI_TIMESTAMP = (new Date()).format("MMddHHmmss", TimeZone.getTimeZone('UTC'))

                            sh "npm config set //${env.NPM_ADDR}/:_authToken ${env.NPM_TOKEN}"
                            sh "npm whoami"
                            try {

                                sh """
                                     eval \$(next-lerna-version); \
                                     export CI_ALPHA_VERSION=\$NEXT_LERNA_VERSION-alpha.${env.CI_TIMESTAMP}; \
                                     echo \$CI_ALPHA_VERSION; \
                                    ./node_modules/.bin/lerna publish --skip-git --force-publish=* --yes --repo-version \$CI_ALPHA_VERSION --canary
                                """
                            } catch(Exception e) {
                            }
                        }
                    }
                }
            }
        }

        stage('Create resolve-app') {
            steps {
                script {
                    docker.image('testcafe/testcafe').inside {
                        sh """
                            echo "echo \\"\\\$@\\" && /usr/bin/google-chrome-unstable --no-default-browser-check --no-first-run --disable-gpu --headless --no-sandbox --user-data-dir=/data \\"\\\$@\\"" > /chromerunner.sh
                            chmod +x /chromerunner.sh
                            /chromerunner.sh about:blank &
                            npm install -g testcafe
                            npm install -g next-lerna-version
                            eval \$(next-lerna-version)
                            export CI_ALPHA_VERSION=\$NEXT_LERNA_VERSION-alpha.${env.CI_TIMESTAMP}
                            echo \$CI_ALPHA_VERSION
                            rm -rf ./stage
                            mkdir stage
                            cd ./stage
                            npm install -g create-resolve-app@\$CI_ALPHA_VERSION
                            create-resolve-app --version=\$CI_ALPHA_VERSION --sample todolist
                            cd ./todolist
                            npm run test:e2e -- --browser=path:/chromerunner.sh &
                            sleep 10
                            ps aux
                            sleep 100000
                        """
                    }
                }
            }
        }
    }
}

