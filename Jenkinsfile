pipeline {
    agent {
        docker { image 'reimagined/node-testcafe' }
    }
    stages {
        stage('Unit tests') {
            steps {
                script {
                    sh 'npm install'
                    sh 'npm run bootstrap'
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

        stage('Create resolve-app [ todolist ]') {
            steps {
                script {
                    sh """
                        /prepare-chromium.sh

                        eval \$(next-lerna-version)
                        export CI_ALPHA_VERSION=\$NEXT_LERNA_VERSION-alpha.${env.CI_TIMESTAMP}

                        rm -rf ./stage
                        mkdir stage
                        cd ./stage

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
    }
}

