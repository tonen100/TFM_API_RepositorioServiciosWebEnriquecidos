BASE_SITE=restapimantics.governify.io

export NODE_ENV=production
export PORT=8080
export DBPORT=27017
export FRONT_PORT=4200
export URL_API=https://${BASE_SITE}/v1/
export VIRTUAL_HOST=${BASE_SITE}

docker-compose -p ${VIRTUAL_HOST} up -d --build --remove-orphans
