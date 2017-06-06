pipeline {
     agent any
        stages {
            stage('Unit tests') {
                steps {
                    parallel(
                        "node:6.1": {
                            script {
                                dir('node_6_1') {
                                    checkout scm
                                    docker.image('node:6.1').inside {
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
                steps {
                    script {
                        docker.image('node:7.10').inside {
                            sh 'npm install'
                            sh 'npm run bootstrap'
                            sh 'find examples/todo/node_modules -maxdepth 1 -type l -delete'
                            sh 'cp -r ./packages/* ./examples/todo/node_modules'
                        }
                    }
                    dir('examples/todo') {
                        script {
                            sh 'docker-compose up --build -d'
                            EXIT_CODE = sh (
                                script: 'docker wait todo_testcafe_1',
                                returnStdout: true
                            ).trim()
                            sh 'docker logs todo_testcafe_1'
                            sh 'docker-compose down --rmi all'
                            sh "exit ${EXIT_CODE}"
                        }
                    }
                }
            }
        }
}
