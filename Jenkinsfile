pipeline {

  /*
   * Run everything on an existing agent configured with a label 'jk-slave-agents'.
   */
  agent {
    label 'jk-slave-agent-label'
  }

  stages {
    stage('InitializeJob') {
      steps {
        sh """
          whoami 
          pwd 
          ls -lrt   
        """
      }
    }

    stage('BuildApp') {
      steps {
        dir("./"){
          sh 'npm install'
        }
      }
    }

    stage('TestApp'){
      parallel {
        stage('UnitTest'){
          steps {
            dir("./") {
              echo "Unit Test Happening"
            }
          }
        }
        stage('FunctionalTest') {
          steps {
             dir("./") {
              echo "Function Test Happening"
            }
          }
        }
      }
    }

    stage('PackageAPP') {
      steps {
        dir("./") {
          sh 'ls -lrta'
          sh 'npm run build'
          sh 'ls -lrta'
          sh 'tar -zcvf build.tar.gz-v${BUILD_NUMBER} build'
        }
      }
    }
    stage('ShipArtifacts') {
      steps {
        dir("./") {
          sh "echo -e '\033[32m App Version Artifact - build.tar.gz-v${BUILD_NUMBER} - is ready to ship to s3bucket \033[0m'"
          sh "hostname -f"
          sh "aws --version"
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

