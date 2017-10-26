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

                            env.CI_TIMESTAMP = (new Date()).format("MMddHHmmss", TimeZone.getTimeZone('UTC'))

                            sh "npm config set //${env.NPM_ADDR}/:_authToken ${env.NPM_TOKEN}"
                            sh "npm whoami"
                            try {

                                sh """
                                     eval \$(node -e "const lerna = require('./lerna.json'); let [major, minor, patch] = lerna.version.split('.'); patch = +patch + 1; console.log('export NEXT_NPM_VERSION='+[major, minor, patch].join('.'))"); \
                                     export CI_ALPHA_VERSION=\$NEXT_NPM_VERSION-alpha.${env.CI_TIMESTAMP}; \
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
                    docker.image('node:8').inside {
                        sh """
                            eval \$(node -e "const lerna = require('./lerna.json'); let [major, minor, patch] = lerna.version.split('.'); patch = +patch + 1; console.log('export NEXT_NPM_VERSION='+[major, minor, patch].join('.'))"); \
                            export CI_ALPHA_VERSION=\$NEXT_NPM_VERSION-alpha.${env.CI_TIMESTAMP}; \
                            echo \$CI_ALPHA_VERSION; \
                            rm -rf ./stage; \
                            mkdir stage; \
                            cd ./stage; \
                            npm install -g create-resolve-app@\$CI_ALPHA_VERSION; \
                            create-resolve-app --version=\$CI_ALPHA_VERSION --sample todolist; \
                            cd ./todolist; \
                            npm run test:e2e;
                        """
                    }
                }
            }
        }
    }
}

