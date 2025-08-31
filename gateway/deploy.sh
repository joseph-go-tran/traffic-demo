#!/bin/bash

# Parse command line arguments or use default values
while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --service-path)
      SERVICE_PATH="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    *)
      echo "Invalid argument: $1"
      exit 1
      ;;
  esac
done

# Ensure all required parameters are provided
if [[ -z $SERVICE || -z $SERVICE_PATH || -z $MODE ]]; then
  echo "Usage: $0 --service <SERVICE> --service-path <SERVICE_PATH> --mode <MODE>"
  exit 1
fi

SERVICE_DIR="${SERVICE_PATH}/${SERVICE}"

if [[ ! -d $SERVICE_DIR ]]; then
  mkdir -p "$SERVICE_DIR/"
fi

cleanup() {
  echo "Cleaning up..."
  docker system prune -a -f
}

zero_downtime_deploy() {
  old_container_id=$(docker ps -f name=$SERVICE -q | tail -n1)

  docker compose up -d --no-deps --scale $SERVICE=2 --no-recreate $SERVICE

  docker stop $old_container_id
  docker rm $old_container_id

  docker compose up -d --no-deps --scale $SERVICE=1 --no-recreate $SERVICE
}

if [[ $MODE == "deploy" ]]; then
  echo "Start build and deploy $SERVICE"

  cd $SERVICE_DIR

  if [[ -n $SERVICE ]]; then
    # Perform zero-downtime deployment for the specific service
    docker compose pull $SERVICE
    zero_downtime_deploy
  else
    echo "Service name not provided for zero-downtime deployment"
    exit 1
  fi

  cleanup
  echo "Deploy successfully"
fi
