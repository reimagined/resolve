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
                            env.NPM_ADDR = 'registry.npmjs.org'
                            env.CI_BUILD_VERSION = (new Date()).format("MMddHHmmss", TimeZone.getTimeZone('UTC'))

                            sh "npm config set //${env.NPM_ADDR}/:_authToken ${env.NPM_TOKEN}"
                            sh "npm whoami"
                            try {
                                sh "./node_modules/.bin/lerna publish --skip-git --force-publish=* --yes --repo-version 0.0.1-alpha.${env.CI_BUILD_VERSION}"
                            } catch(Exception e) {
                            }
                        }
                    }
                }
            }
        }
    }
}

