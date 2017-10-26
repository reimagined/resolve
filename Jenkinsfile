import groovy.json.JsonSlurper;

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

                            File f = new File('./lerna.json')
                            def slurper = new JsonSlurper()
                            def jsonText = f.getText()
                            def json = slurper.parseText(jsonText)
                            def (major, minor, patch) = json.version.toString().tokenize(".")
                            patch = patch.toInteger() + 1
                            def nextVersion = major + "." + minor + "." + patch
                            env.NEXT_NPM_VERSION = nextVersion

                            env.CI_BUILD_VERSION = "${env.NEXT_NPM_VERSION}-alpha." + (new Date()).format("MMddHHmmss", TimeZone.getTimeZone('UTC'))

                            sh "npm config set //${env.NPM_ADDR}/:_authToken ${env.NPM_TOKEN}"
                            sh "npm whoami"
                            try {
                                sh "./node_modules/.bin/lerna publish --skip-git --force-publish=* --yes --repo-version ${env.CI_BUILD_VERSION} --canary"
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
                            rm -rf ./stage; \
                            mkdir stage; \
                            cd ./stage; \
                            npm install -g create-resolve-app@${env.CI_BUILD_VERSION}; \
                            create-resolve-app --version=${env.CI_BUILD_VERSION} --sample todolist; \
                            cd ./todolist; \
                            npm run test:e2e;
                        """
                    }
                }
            }
        }
    }
}

