#!/usr/bin/env bash
basedir=$(dirname "${0}")
vers=$(git -C "${basedir}" describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
vers=${vers#v}

# In dev the image is built locally, so the version comes from the repository: keeping it in
# conf.env would freeze it to the install date. In prod VERSION pins the image tag pulled from
# GHCR and must stay whatever conf.env holds - do not export it here.
if [ "${2}" = "dev" ]; then
  export VERSION="${vers}"
fi
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
  echo -e "  a, autoupdate [\e[33mprod\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Deploy a new release if one was published. Meant to be run from cron\n"
  echo -e "     rollback [\e[33mprod\e[39m] [\e[33mX.Y.Z\e[39m] – \e[33mMandatory\e[39m"
  echo -e "                     Pin production to a given version and freeze automatic updates\n"
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
    echo -e "      Ensure docker and yarn, docker-compose are installed"
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
      read -rsp "  Enter the backend secret key : " backendsecretkey
      echo
    done
  fi

  # Database user
  while [ -z ${dbuser} ]; do
    read -rp "  Enter the database username : " dbuser
  done
  # Database password (not empty and >10 characters)
  while [[ ${dbpassword} = "" || ${#dbpassword} -lt 10 ]]; do
    read -rsp "  Enter the database password (> 10 characters) : " dbpassword
    echo
  done

  # Mailjet API key
  while [ -z ${mailjetkey} ]; do
    read -rsp "  Enter the MailJet API key : " mailjetkey
    echo
  done
  # Mailjet API secret
  while [ -z ${mailjetsecret} ]; do
    read -rsp "  Enter the MailJet API secret : " mailjetsecret
    echo
  done
}

# development .env file creation method
devInstall() {
  touch "${basedir}"/.conf/development/conf.env
  { echo "# FRONTEND"
    echo "FRONTEND_NAME=tout_doux_frontend"
    echo "FRONTEND_PORT=3000"
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
  { echo "IMAGE_PREFIX=ghcr.io/asiberus/tout-doux"
    echo "VERSION="
    echo "PINNED=false"
    echo "BACKUP_SCRIPT="
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
  for COMMAND in "docker" "npm"; do
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
    eval "docker compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env build"
  elif [ "${1}" = "prod" ]; then
    echo -e "Pulling Tout Doux production images"
    eval "docker compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env pull"
  fi

  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux is built successfully!"
}

function startApp(){
  if [ "${1}" = "dev" ]; then
    echo -e "Starting Tout Doux in development environment"
    eval "docker compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env up -d"
  elif [ "${1}" = "prod" ]; then
    if ! grep -q '^VERSION=[0-9]' "${basedir}"/.conf/production/conf.env; then
      echo -e "\e[31mERROR\e[39m No image version is pinned in conf.env"
      echo -e "      Run ./td.sh autoupdate prod first, it resolves and pins the current release"
      exit 1
    fi
    echo -e "Starting Tout Doux in production environment"
    eval "docker compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env up -d"
  fi

  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux started!"
  echo -e "      If this is the first start, please run the following command when the app is started :"
  echo -e "      $ docker exec -it tout_doux_backend python manage.py createsuperuser"
}

function quitApp(){
  if [ "${1}" = "dev" ]; then
    echo -e "Stopping Tout Doux containers in development environment"
    eval "docker compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env stop"
  elif [ "${1}" = "prod" ]; then
    echo -e "Stopping Tout Doux containers in production environment"
    eval "docker compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env stop"
  fi

  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux exited!"
}

function resetApp(){
  message="\e[93mWARNING\e[39m This command will remove the following Tout Doux's docker components : containers"

  if [ "${1}" = "dev" ]; then
    stopCommand="docker compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env stop"
    command="docker compose --file ${basedir}/docker-compose.yml --env-file ${basedir}/.conf/development/conf.env down"
    shift
  elif [ "${1}" = "prod" ]; then
    stopCommand="docker compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env stop"
    command="docker compose --file ${basedir}/docker-compose.prod.yml --env-file ${basedir}/.conf/production/conf.env down"
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

function autoUpdateApp(){
  envFile="${basedir}/.conf/production/conf.env"

  log() { echo "$(date '+%Y-%m-%d %H:%M:%S') —— $*"; }
  # Only chatty on a terminal: from cron nothing must be printed when there is nothing
  # to deploy, otherwise the log grows by a few lines every ten minutes.
  trace() { if [ -t 1 ]; then log "$@"; fi; }

  imagePrefix=$(grep '^IMAGE_PREFIX=' "${envFile}" | cut -d= -f2-)
  current=$(grep '^VERSION=' "${envFile}" | cut -d= -f2-)
  pinned=$(grep '^PINNED=' "${envFile}" | cut -d= -f2-)
  backupScript=$(grep '^BACKUP_SCRIPT=' "${envFile}" | cut -d= -f2-)

  trace "Tout Doux autoupdate starting"
  trace "deployed version: ${current:-none}"

  # A rollback sets PINNED=true. Without this guard the cron would reinstall within ten
  # minutes the very release the rollback moved away from.
  if [ "${pinned}" = "true" ]; then
    trace "PINNED is true, automatic updates are frozen"
    exit 0
  fi

  trace "pulling the repository"
  git -C "${basedir}" pull --ff-only --quiet

  trace "pulling ${imagePrefix}-frontend:latest"
  docker pull -q "${imagePrefix}-frontend:latest" > /dev/null

  new=$(docker image inspect \
    --format '{{index .Config.Labels "org.opencontainers.image.version"}}' \
    "${imagePrefix}-frontend:latest")

  if [ -z "${new}" ]; then
    log "ERROR version label missing on ${imagePrefix}-frontend:latest"
    exit 1
  fi

  trace "published version: ${new}"

  if [ "${new}" = "${current}" ]; then
    trace "nothing to deploy"
    exit 0
  fi

  log
  log "new release detected: ${current:-none} -> ${new}"

  if [ -z "${backupScript}" ]; then
    log "ERROR BACKUP_SCRIPT is not set in conf.env, deployment cancelled"
    exit 1
  fi

  log "running backup: ${backupScript}"

  # td.sh does not enable set -e: without this test a failing backup would be ignored and
  # the migrations would run against a backup that was never written.
  if ! "${backupScript}"; then
    log "ERROR backup failed, deployment cancelled"
    exit 1
  fi

  log "pinning VERSION=${new} in conf.env"
  sed -i.bak "s/^VERSION=.*/VERSION=${new}/" "${envFile}" && rm -f "${envFile}.bak"

  compose="docker compose --file ${basedir}/docker-compose.prod.yml --env-file ${envFile}"

  log "pulling production images"
  eval "${compose} pull -q"

  log "recreating containers"
  eval "${compose} up -d"

  log "pruning obsolete images"
  docker image prune -f \
    --filter "label=org.opencontainers.image.source=https://github.com/Asiberus/Tout-doux" > /dev/null

  log "deployed ${new}"
}

function rollbackApp(){
  envFile="${basedir}/.conf/production/conf.env"

  sed -i.bak "s/^VERSION=.*/VERSION=${1}/" "${envFile}"
  sed -i.bak "s/^PINNED=.*/PINNED=true/" "${envFile}"
  rm -f "${envFile}.bak"

  eval "docker compose --file ${basedir}/docker-compose.prod.yml --env-file ${envFile} up -d"

  echo -e "\n\e[32mSUCCESS\e[39m Tout Doux pinned to ${1}"
  echo -e "      Automatic updates are frozen. Set PINNED=false in conf.env to resume."
}

# Script header - skipped for autoupdate, which runs from cron and must print nothing
# when there is no new release to deploy
if [[ ! ${1} == @(a|-a|autoupdate|--autoupdate) ]]; then
  echo # Line break
  echo -e "  ## ---------------------------------- ##"
  echo -e "  ##              \e[92mTout Doux\e[39m             ##"
  echo -e "  ##              2022/2023             ##"
  echo -e "  ##               v${vers}               ##"
  echo -e "  ## ---------------------------------- ##"
  echo # Line break
fi

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
    -a|a|--autoupdate|autoupdate)
      if [[ ! ${2} == "prod" ]]; then
        echo -e "\e[31mERROR\e[39m \"${2}\" is not a supported argument to autoupdate Tout Doux."
        echo -e "      Only the production environment can be updated automatically"
        exit 1
      fi
      autoUpdateApp
      exit 0
    ;;
    --rollback|rollback)
      if [[ ! ${2} == "prod" || -z ${3} ]]; then
        echo -e "\e[31mERROR\e[39m Missing or invalid argument to roll Tout Doux back."
        echo -e "      Usage: ./td.sh rollback prod X.Y.Z"
        exit 1
      fi
      rollbackApp ${3}
      exit 0
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
