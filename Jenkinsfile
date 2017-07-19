pipeline {
    agent any
    stages {
        stage('Unit tests') {
            steps {
                script {
                    docker.image('node:8').inside {
                        sh 'npm install'
                        sh 'npm run bootstrap'
                        sh 'npm run lint'
                        sh 'npm test'
                    }
                }
            }
        }

        stage('End-to-end tests') {
            steps {
                script {
                    sh 'find examples/todo/node_modules -maxdepth 1 -type l -delete'
                    sh 'cp -r ./packages/* ./examples/todo/node_modules'
                    PROJECT_NAME = sh (
                        script: "/var/scripts/get-project-name.sh",
                        returnStdout: true
                    ).trim()

                    dir('examples/todo') {
                        sh 'docker-compose -p ${PROJECT_NAME} up --build --exit-code-from testcafe'
                    }
                }
            }
        }


        stage('Check dependent applications') {
            when {
                not { branch 'master' }
            }
            steps {
                script {
                    docker.image('node:8').inside {
                        withCredentials([
                            string(credentialsId: 'LOCAL_NPM_AUTH_TOKEN', variable: 'NPM_TOKEN'),
                            string(credentialsId: 'LOCAL_NPM_HOST_PORT', variable: 'NPM_ADDR')
                        ]) {
                            try {
                                sh "npm config set registry http://${env.NPM_ADDR}"
                                sh "npm config set //${env.NPM_ADDR}/:_authToken ${env.NPM_TOKEN}"
                                sh "npm whoami"
                                sh "./node_modules/.bin/lerna publish --force-publish=* --canary --yes"
                            } catch(Exception e) {
                            }
                        }
                    }


                    GIT_HASH_COMMIT = sh (
                        script: 'git rev-parse HEAD | cut -c1-8',
                        returnStdout: true
                    ).trim()

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
                                    value: "${GIT_HASH_COMMIT}"
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

        stage('Publish / npm') {
            when {
                branch 'master'
            }
            steps {
                script {
                    docker.image('node:8').inside {
                        withCredentials([
                            string(credentialsId: 'NPM_CREDENTIALS', variable: 'NPM_TOKEN')
                        ]) {
                            sh "npm config set //registry.npmjs.org/:_authToken ${env.NPM_TOKEN}"
                            sh "npm whoami"
                            sh "./node_modules/.bin/lerna publish --canary --yes"
                       }
                    }
                }
            }
        }
    }

    post {
        always {
            dir('examples/todo') {
                sh "docker-compose -p ${PROJECT_NAME} down --rmi all"
            }
            deleteDir()
        }
    }
}