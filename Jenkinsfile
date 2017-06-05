pipeline {
    agent any
    stages {
        stage('Unit tests') {
            steps {
                parallel(
                    "node:6.10": {
                        script {
                            dir('node_6_10') {
                                checkout scm
                                docker.image('node:6.10').inside {
                                    sh 'npm install'
                                    sh 'npm run bootstrap'
                                    sh 'npm run lint'
                                    sh 'npm test'
                                }
                                deleteDir()
                            }
                        }
                    },
                    "node:7.10": {
                        script {
                            dir('node_7_10') {
                                 checkout scm
                                 docker.image('node:7.10').inside {
                                     sh 'npm install'
                                     sh 'npm run bootstrap'
                                     sh 'npm run lint'
                                     sh 'npm test'
                                 }
                                deleteDir()
                            }
                        }
                    }
                )
            }
        }

        stage('Integration testing') {
            steps{
                script {
                    docker.image('node:7.10').inside {
                        sh 'npm install'
                        sh 'npm run bootstrap'
                        sh 'find examples/todolist/node_modules -maxdepth 1 -type l -delete'
                        sh 'cp -r ./packages/* ./examples/todolist/node_modules'
                    }
                }
                dir('examples/todolist') {
                    sh './integration_test.sh'
                }
            }
        }

        stage('Publish to npm') {
            agent { docker 'node:7.10' }
            steps {
                script {
                    withCredentials([string(credentialsId: 'NPM_CREDENTIALS', variable: 'NPM_TOKEN')]) {
                        if (env.BRANCH_NAME == 'master') {
                            sh "mkdir -p $HOME"
                            sh "echo //registry.npmjs.org/:_authToken=${env.NPM_TOKEN} > ~/.npmrc"
                            sh 'npm whoami'
                            sh 'node_modules/.bin/lerna publish --canary --yes'
                            sh 'rm ~/.npmrc'
                        } else {
                            echo 'Skip canary publish'
                        }
                    }
                }
            }
        }

        stage('Build okrserver') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'master') {
                        MAIN_VERSION = sh (
                            script: 'grep version lerna.json | cut -d\\" -f4',
                            returnStdout: true
                        ).trim()
                        GIT_HASH_COMMIT = sh (
                            script: 'git rev-parse HEAD | cut -c1-8',
                            returnStdout: true
                        ).trim()

                        echo "${MAIN_VERSION}-alpha.${GIT_HASH_COMMIT}"
                        build job: '../../Resolve-OKR',
                             parameters: [[
                                 $class: 'StringParameterValue',
                                 name: 'NPM_CANARY_VERSION',
                                 value: "${MAIN_VERSION}-alpha.${GIT_HASH_COMMIT}"
                             ]]
                    }
                }
            }
        }
    }
}
