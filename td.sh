#!/usr/bin/env bash
vers="0.4.1" # Must match package.json version number
basedir=$(dirname "${0}")
unset backendsecretkey
unset serverhost
unset apihost
unset dbuser
unset dbpassword
unset mailjetkey
unset mailjetsecret

# Method to display Command help and usage

function usage(){
  echo -e "td.sh : Command help\n"
  echo -e "Usage : ./td.sh [command] [argument]\n"
  echo -e "  i, install  [\e[33mdev\e[39m/\e[33mprod\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Configure environment file and install Tout Doux on the system\n"
  echo -e "  e, edit     [\e[33mdev\e[39m/\e[33mprod\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Edit the environment file\n"
  echo -e "  b, build    [\e[33mdev\e[39m/\e[33mprod\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Build the docker containers\n"
  echo -e "  s, start    [\e[33mdev\e[39m/\e[33mprod\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Start Tout Doux application\n"
  echo -e "  u, update   [\e[33mdev\e[39m/\e[33mprod\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Quit, pull, build and start aplication\n"
  echo -e "  q, quit     [\e[33mdev\e[39m/\e[33mprod\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Stop any running Tout Doux application\n"
  echo -e "  r, reset    [\e[33mdev\e[39m/\e[33mprod\e[39m] – \e[33mMandatory\e[39m | [\e[32m-i\e[39m/\e[32m--images\e[39m] – \e[32mOptional\e[39m | [\e[32m-v\e[39m/\e[32m--volumes\e[39m] – \e[32mOptional\e[39m"
  echo -e "                     Remove existing docker containers and optionally images and volumes. "
  echo -e "                     This command will not remove any .env configuration files\n"
  echo -e "  h, help     Display command usage\n"
}

# Method to check if given command is installed on the system
isInstalled() {
  command -v "${1}" >/dev/null 2>&1
  if [[ $? -ne 0 ]]; then
    echo -e "\e[31mERROR\e[39m ${1} is not installed on the system"
    echo -e "      Ensure docker, docker-compose are installed"
    echo -e "      On a production environment, nginx must be installed as well"
    exit 0
  fi
}

# User .env variables inputs
updateVariables() {
  if [ "${1}" = "prod" ]; then
    # Server host
    while [ -z ${serverhost} ]; do
      read -rp "  Enter the server host: " serverhost
    done

    # Api host
    while [ -z ${apihost} ]; do
      read -rp "  Enter the api host: " apihost
    done

    # django secret key
    while [ -z ${backendsecretkey} ]; do
      read -rp "  Enter the backend secret key : " backendsecretkey
    done
  fi

  # Database user
  while [ -z ${dbuser} ]; do
    read -rp "  Enter the database username : " dbuser
  done
  # Database password (not empty and >10 characters)
  while [[ ${dbpassword} = "" || ${#dbpassword} -lt 10 ]]; do
    read -rp "  Enter the database password (> 10 characters) : " dbpassword
  done

  # Mailjet API key
  while [ -z ${mailjetkey} ]; do
    read -rp "  Enter the MailJet API key : " mailjetkey
  done
  # Mailjet API secret
  while [ -z ${mailjetsecret} ]; do
    read -rp "  Enter the MailJet API secret : " mailjetsecret
  done
}

# development .env file creation method
devInstall() {
  touch "${basedir}"/.conf/development/conf.env
  { echo "VERSION=$vers"
    echo ""
    echo "# FRONTEND"
    echo "FRONTEND_NAME=tout_doux_frontend"
    echo "FRONTEND_PORT=8080"
    echo ""
    echo "# BACKEND"
    echo "BACKEND_NAME=tout_doux_backend"
    echo "BACKEND_HOST=localhost"
    echo "BACKEND_PORT=8000"
    echo "BACKEND_SECRET_KEY=secretKeyHasToBeChanged!"
    echo "BACKEND_DEBUG=1"
    echo "BACKEND_ALLOWED_HOSTS=*"
    echo "BACKEND_USE_EMAIL_FILE_SYSTEM=1"
    echo ""
    echo "# DATABASE"
    echo "DB_POSTGRES_VERSION=16-alpine"
    echo "DB_HOST=tout_doux_db"
    echo "DB_PORT=5432"
    echo "DB_NAME=tout_doux"
    echo "DB_USER=${1}"
    echo "DB_PASSWORD=${2}"
    echo ""
    echo "# ADMINER"
    echo "DB_ADMINER_NAME=tout_doux_adminer"
    echo "DB_ADMINER_PORT=8081"
    echo ""
    echo "# MAILJET"
    echo "MAILJET_API_KEY=${3}"
    echo "MAILJET_API_SECRET=${4}"
  } >> "${basedir}"/.conf/development/conf.env
}

# production .env file creation method
prodInstall() {
  touch "${basedir}"/.conf/production/conf.env
  { echo "VERSION=$vers"
    echo ""
    echo "# FRONTEND/PROXY"
    echo "FRONTEND_NAME=tout_doux_frontend"
    echo "SERVER_PORT=8020"
    echo "SERVER_PROTOCOL=https"
    echo "SERVER_HOST=${1}"
    echo "API_HOST=${2}"
    echo ""
    echo "# BACKEND"
    echo "BACKEND_NAME=tout_doux_backend"
    echo "BACKEND_HOST=localhost"
    echo "BACKEND_PORT=8021"
    echo "BACKEND_SECRET_KEY=${3}"
    echo "BACKEND_DEBUG=0"
    echo "BACKEND_ALLOWED_HOSTS=${2}"
    echo "BACKEND_USE_EMAIL_FILE_SYSTEM=0"
    echo ""
    echo "# DATABASE"
    echo "DB_POSTGRES_VERSION=16-alpine"
    echo "DB_HOST=tout_doux_db"
    echo "DB_PORT=8022"
    echo "DB_NAME=tout_doux"
    echo "DB_USER=${4}"
    echo "DB_PASSWORD=${5}"
    echo ""
    echo "# MAILJET"
    echo "MAILJET_API_KEY=${6}"
    echo "MAILJET_API_SECRET=${7}"
  } >> "${basedir}"/.conf/production/conf.env
}

function createConfFile() {
  # Initialization sequence, fill .env file to fit user inputs and build docker images in either dev, prod or local prod mode
  # Check if all dependencies are installed before doing anything
  for COMMAND in "docker" "docker-compose"; do
    isInstalled "${COMMAND}"
  done

  #  # Check for previous existing .env files, ensure user want to override existing configuration
    if [[ "${1}" = "dev" && -f "${basedir}"/.conf/development/conf.env ]] || [[ "${1}" = "prod" && -f "${basedir}"/.conf/production/conf.env ]]; then
      echo -e "\e[93mWARNING\e[39m Tout Doux has already a configuration file which might be overridden"
      # Can't init to blank to get in while read loop
      replaceconf="td"
      # Wait for user to send yY/nN or blank
      while [[ "${replaceconf}" != "" && "${replaceconf}" != "y" && "${replaceconf}" != "Y" && "${replaceconf}" != "n" && "${replaceconf}" != "N" ]]; do
        read -rp "        Do you still want to proceed? [y/n] " replaceconf
      done
      # Exit if user didn't enter anything, or entered n/N
      if [ "${replaceconf}" = "" ] || [ "${replaceconf}" = "n" ] || [ "${replaceconf}" = "N" ]; then
        exit 0
      fi
    fi
    # Welcome message
    echo -e "Welcome to the Tout Doux installation wizard!"
    echo -e "Please fill the following information to properly configure Tout Doux :\n"
    # Request info from user
    updateVariables "${1}"
    # Runtime mode to configure
    if [ "${1}" = "dev" ]; then
      rm -rf "${basedir}"/.conf/development/conf.env
      echo "Creating configuration file for development environment."
      devInstall "${dbuser}" "${dbpassword}" "${mailjetkey}" "${mailjetsecret}"
    elif [ "${1}" = "prod" ]; then
      rm -rf "${basedir}"/.conf/production/conf.env
      echo "Creating configuration file for production environment."
      prodInstall "${serverhost}" "${apihost}" "${backendsecretkey}" "${dbuser}" "${dbpassword}" "${mailjetkey}" "${mailjetsecret}"
    fi
    echo # Line break
    echo -e "\e[32mSUCCESS\e[39m Tout Doux installed!"

}

function editConfFile() {
  # Runtime mode to configure
  if [ ${1} == "prod" ]; then
		confFile=$(echo $(pwd)/.conf/production/conf.env)
		envList=("SERVER_HOST" "API_HOST" "BACKEND_SECRET_KEY" "DB_USER" "DB_PASSWORD" "MAILJET_API_KEY" "MAILJET_API_SECRET")
	else
		confFile=$(echo $(pwd)/.conf/development/conf.env)
		envList=("DB_USER" "DB_PASSWORD" "MAILJET_API_KEY" "MAILJET_API_SECRET")

	fi
	echo -e "You are going to modify \033[38;5;226m${confFile}\033[00m"
	# Looping over all terms that will need to be updated in file
	for envVar in "${envList[@]}"; do
		# Get whole line matching current envVar which need an update
		tmp=$(grep ${envVar} ${confFile})
		echo "tmp"
		# Check if current envVar exists in file
		# if yes, then update it or not
		if [ $? -eq 0 ]; then
			# Printing current value in file
			echo "Currently ${tmp}"
			# Can't start looping with an empty variable
			replaceVar="td"
			while [[ ${replaceVar} != "" && ${replaceVar} != "y" && "${replaceVar}" != "Y" && "${replaceVar}" != "n" && "${replaceVar}" != "N" ]]; do
				read -rp "  Do you want to replace ${envVar} current value ? [y/n] " replaceVar
			done
			# If var needs to be replaced then replace it
			# Else continue to next var
			if [[ ${replaceVar} == "y" || ${replaceVar} == "Y" ]]; then
				read -rp "  ${envVar} = " replaceVar
				sed -i '' "s/${tmp}/${envVar}=${replaceVar}/g" ${confFile}
			fi
    fi
	done

  echo -e "\e[32mSUCCESS\e[39m Tout Doux edited!"
}

function buildApp(){
  if [ "${1}" = "dev" ]; then
    echo -e "Building Tout Doux for development environment"
    eval "docker-compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env build"
  elif [ "${1}" = "prod" ]; then
    echo -e "Building Tout Doux for production environment"
    eval "docker-compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env build"
  fi

  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux is built successfully!"
}

function startApp(){
  if [ "${1}" = "dev" ]; then
    echo -e "Starting Tout Doux in development environment"
    eval "docker-compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env up -d"
  elif [ "${1}" = "prod" ]; then
    echo -e "Starting Tout Doux in production environment"
    eval "docker-compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env up -d"
  fi

  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux started!"
  echo -e "      If this is the first start, please run the following command when the app is started :"
  echo -e "      $ docker exec -it tout_doux_backend python manage.py createsuperuser"
}

function quitApp(){
  if [ "${1}" = "dev" ]; then
    echo -e "Stoping Tout Doux containers in development environment"
    eval "docker-compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env stop"
  elif [ "${1}" = "prod" ]; then
    echo -e "Stoping Tout Doux containers in production environment"
    eval "docker-compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env stop"
  fi

  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux exited!"
}

function resetApp(){
  message="\e[93mWARNING\e[39m This command will remove the following Tout Doux's docker components : containers"

  if [ "${1}" = "dev" ]; then
    stopCommand="docker-compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env stop"
    command="docker-compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env down"
    shift
  elif [ "${1}" = "prod" ]; then
    stopCommand="docker-compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env stop"
    command="docker-compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env down"
    shift
  fi

  for option in ${@}; do
    case $option in
      -i|--images)
        command="$command --rmi local"
        message="$message, images"
      ;;
      -v|--volumes)
        command="$command --volumes"
        message="$message, volumes"
      ;;
      *)
        echo -e "\e[31mERROR\e[39m Unknown $option option. See --help"
        exit 1
      ;;
    esac
  done

  echo -e "$message"
  resetTd="td" # Can't init to blank to get in while read loop
  # Wait for user to send yY/nN or blank
  while [[ "${resetTd}" != "" && "${resetTd}" != "y" && "${resetTd}" != "Y" && "${resetTd}" != "n" && "${resetTd}" != "N" ]]; do
    read -rp "        Do you want to fully reset Tout Doux? [y/n] " resetTd
  done
  # Exit if user didn't enter anything, or entered n/N
  if [ "${resetTd}" = "" ] || [ "${resetTd}" = "n" ] || [ "${resetTd}" = "N" ]; then
    exit 0
  fi

  # Ensure all docker are stopped
  echo # Line break
  echo -e "1/3. Stopping any Tout Doux containers"
  eval "$stopCommand"
  echo # Line break
  # Remove Tout Doux related dockers
  echo -e "2/3. Removing Tout Doux services"
  eval "$command"
  echo # Line break
  echo -e "3/3. Complete Tout Doux reset"
  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux reset!"
}

function updateApp(){
  echo -e "Start updating Tout Doux!"
  quitApp ${1}
  buildApp ${1}
  startApp ${1}

  echo -e "\e[32mSUCCESS\e[39m Tout Doux updated!"
}

# Script header
echo # Line break
echo -e "  ## ---------------------------------- ##"
echo -e "  ##              \e[92mTout Doux\e[39m             ##"
echo -e "  ##              2022/2023             ##"
echo -e "  ##               v${vers}               ##"
echo -e "  ## ---------------------------------- ##"
echo # Line break

# First of all, test if user has send an argument
if [ $# -eq 0 ]; then
  echo -e "td.sh : Missing argument\n"
  echo -e "\e[31mERROR\e[39m Command executed without any arguments"
  echo -e "      Check command help for available arguments: ./td.sh --help"
  exit 1
fi

for option in ${@}
do
  case "${1}" in
    -h|h|--help|help)
      usage
      exit 0
    ;;
    -i|i|--install|install)
      if [[ ! ${2} == @(dev|prod) ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to create Tout Doux configuration file."
        echo -e "      Check command help for available arguments: ./td.sh --help"
        exit 1
      fi
      createConfFile ${2}
      shift
    ;;
    -e|e|--edit|edit)
      if [[ ! ${2} == @(dev|prod) ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to edit Tout Doux configuration file."
        echo -e "      Check command help for available arguments: ./td.sh --help"
        exit 1
      fi
      editConfFile ${2}
      shift
    ;;
    -b|b|--build|build)
      if [[ ! ${2} == @(dev|prod) ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to build Tout Doux."
        echo -e "      Check command help for available arguments: ./td.sh --help"
        exit 1
      fi
      buildApp ${2}
      shift
    ;;
    -s|s|--start|start)
      if [[ ! ${2} == @(dev|prod) ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to start Tout Doux."
        echo -e "      Check command help for available arguments: ./td.sh --help"
        exit 1
      fi
      startApp ${2}
      shift
    ;;
    -u|u|--update|update)
      if [[ ! ${2} == @(dev|prod) ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to update Tout Doux."
        echo -e "      Check command help for available arguments: ./td.sh --help"
        exit 1
      fi
      updateApp ${2}
      exit 0
    ;;
    -q|q|--quit|quit)
      if [[ ! ${2} == @(dev|prod) ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to stop Tout Doux."
        echo -e "      Check command help for available arguments: ./td.sh --help"
        exit 1
      fi
      quitApp ${2}
      shift
    ;;
    -r|r|--reset|reset)
      if [[ ! ${2} == @(dev|prod) ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to reset Tout Doux."
        echo -e "      Check command help for available arguments: ./td.sh --help"
        exit 1
      fi
        shift
        resetApp $*
        exit 0
    ;;
    "")
      exit 0
    ;;
    *)
      echo -e "\e[31mERROR\e[39m Invalid '${1}' option. See ${0} --help"
      exit 1
    ;;
  esac
  shift
done
