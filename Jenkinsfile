pipeline {
  agent any
  stages {
    stage('检出') {
      steps {
        checkout([$class: 'GitSCM',
        branches: [[name: GIT_BUILD_REF]],
        userRemoteConfigs: [[
          url: GIT_REPO_URL,
          credentialsId: CREDENTIALS_ID
        ]]])
      }
    }
    stage('依赖漏洞扫描') {
      steps {
        npmAuditInDir(directory: '/', collectResult: true)
      }
    }
    stage('构建 Docker 镜像') {
      steps {
        sh "docker build -f ${DOCKERFILE_PATH} -t ${CODING_DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_VERSION} ${DOCKER_BUILD_CONTEXT}"
      }
    }
    stage('构建镜像并推送到 CODING Docker 制品库') {
      steps {
        script {
          docker.withRegistry(
            "${CCI_CURRENT_WEB_PROTOCOL}://${CODING_DOCKER_REG_HOST}",
            "${CODING_ARTIFACTS_CREDENTIALS_ID}"
          ) {
            docker.image("${CODING_DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_VERSION}").push()
          }
        }

      }
    }
    stage('部署到远端服务') {
      steps {
        script {
          def remoteConfig = [:]
          remoteConfig.name = "my-remote-server"
          remoteConfig.host = "${REMOTE_HOST}"
          remoteConfig.port = "${REMOTE_SSH_PORT}".toInteger()
          remoteConfig.allowAnyHosts = true

          withCredentials([
            sshUserPrivateKey(
              credentialsId: "${REMOTE_CRED}",
              keyFileVariable: "privateKeyFilePath"
            ),
            usernamePassword(
              credentialsId: "${CODING_ARTIFACTS_CREDENTIALS_ID}",
              usernameVariable: 'CODING_DOCKER_REG_USERNAME',
              passwordVariable: 'CODING_DOCKER_REG_PASSWORD'
            )
          ]) {
            // SSH 登陆用户名
            remoteConfig.user = "${REMOTE_USER_NAME}"
            // SSH 私钥文件地址
            remoteConfig.identityFile = privateKeyFilePath

            // 请确保远端环境中有 Docker 环境
            sshCommand(
              remote: remoteConfig,
              command: "docker login -u ${CODING_DOCKER_REG_USERNAME} -p ${CODING_DOCKER_REG_PASSWORD} ${CODING_DOCKER_REG_HOST}",
              sudo: false,
            )

            sshCommand(
              remote: remoteConfig,
              command: "docker rm -f ${DOCKER_IMAGE_NAME} | true",
              sudo: false,
            )
            
            DOCKER_IMAGE_NOTAG = sh(
              script: "echo ${CODING_DOCKER_REG_HOST}/${CODING_DOCKER_IMAGE_NAME}",
              returnStdout: false
            )
            sshCommand(
              remote: remoteConfig,
              command: "docker rmi  $(docker images | grep ${DOCKER_IMAGE_NOTAG} | awk '{print $3}')",
               sudo: false,
            )
            // DOCKER_IMAGE_VERSION 中涉及到 GIT_LOCAL_BRANCH / GIT_TAG / GIT_COMMIT 的环境变量的使用
            // 需要在本地完成拼接后，再传入到远端服务器中使用
            DOCKER_IMAGE_URL = sh(
              script: "echo ${CODING_DOCKER_REG_HOST}/${CODING_DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_VERSION}",
              returnStdout: false
            )

            sshCommand(
              remote: remoteConfig,
              command: "docker run -d --name ${DOCKER_IMAGE_NAME} --network=docker_net_aliyun --network-alias=${DOCKER_IMAGE_NAME} --restart=always ${DOCKER_IMAGE_URL}",
              sudo: false,
            )

            echo "部署成功，请到 http://${REMOTE_HOST}:3000 预览效果"
          }
        }

      }
    }
  }
  environment {
    CODING_DOCKER_REG_HOST = "${CCI_CURRENT_TEAM}-docker.pkg.${CCI_CURRENT_DOMAIN}"
    CODING_DOCKER_IMAGE_NAME = "${PROJECT_NAME.toLowerCase()}/${DOCKER_REPO_NAME}/${DOCKER_IMAGE_NAME}"
  }
}