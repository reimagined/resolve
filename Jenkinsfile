pipeline {
    agent any
    stages {
        // stage('Unit tests') {
        //     steps {
        //         script {
        //             docker.image('node:8').inside {
        //                 sh 'npm install'
        //                 sh 'npm run bootstrap'
        //                 sh 'npm run lint'
        //                 sh 'npm test'
        //             }
        //         }
        //     }
        // }

        // stage('End-to-end tests') {
        //     steps {
        //         script {
        //             sh 'find examples/todo/node_modules -maxdepth 1 -type l -delete'
        //             sh 'cp -r ./packages/* ./examples/todo/node_modules'
        //             PROJECT_NAME = sh (
        //                 script: "/var/scripts/get-project-name.sh",
        //                 returnStdout: true
        //             ).trim()

        //             dir('examples/todo') {
        //                 sh "docker-compose -p ${PROJECT_NAME} up --build --exit-code-from testcafe"
        //             }
        //         }
        //     }
        // }

        stage('Publish and trigger') {
            steps {
                script {
                    def isMasterBranch = env.BRANCH_NAME == 'master'
                    def credentials = [
                        string(credentialsId: isMasterBranch ? 'NPM_CREDENTIALS' : 'LOCAL_NPM_AUTH_TOKEN', variable: 'NPM_TOKEN')
                    ];
                    if (!isMasterBranch) {
                        credentials.push(string(credentialsId: 'LOCAL_NPM_HOST_PORT', variable: 'NPM_ADDR'))
                    }
                    // docker.image('node:8').inside {
                    //     withCredentials(credentials) {
                    //         try {
                    //             if (!isMasterBranch) {
                    //                 sh "npm config set registry http://${env.NPM_ADDR}"
                    //             } else {
                    //                 env.NPM_ADDR = 'registry.npmjs.org'
                    //             }
                    //             sh "npm config set //${env.NPM_ADDR}/:_authToken ${env.NPM_TOKEN}"
                    //             sh "npm whoami"
                    //             sh "./node_modules/.bin/lerna publish --canary --yes"
                    //         } catch(Exception e) {
                    //         }
                    //     }
                    // }

                    commitHash = sh (
                        script: 'git rev-parse HEAD | cut -c1-8',
                        returnStdout: true
                    ).trim()

                    def credentialsId = null
                    if (isMasterBranch) {
                        credentialsId = 'UPDATE_VERSION_JOBS'
                    } else {
                        credentialsId = 'DEPENDENT_JOBS_LIST'
                    }

                    withCredentials([
                        string(credentialsId: credentialsId, variable: 'JOBS')
                    ]) {
                        def jobs = env.JOBS.split(';')
                        for (def i = 0; i < jobs.length; ++i) {
                            sh "echo '*** JOB *** ${job}'"
                            build([
                                job: jobs[i],
                                parameters: [[
                                    $class: 'StringParameterValue',
                                    name: 'NPM_CANARY_VERSION',
                                    value: commitHash
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

    // post {
    //     always {
    //         dir('examples/todo') {
    //             sh "docker-compose -p ${PROJECT_NAME} down --rmi all"
    //         }
    //         deleteDir()
    //     }
    // }
}

