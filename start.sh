BASE_SITE=restapimantics.governify.io
echo $1
export NODE_ENV=production
export PORT=8080
export DBPORT=27017
export FRONT_PORT=4200
export URL_API=https://${BASE_SITE}/v1/
export VIRTUAL_HOST=${BASE_SITE}
export ROOT_FRONT=$1

docker-compose -p ${VIRTUAL_HOST} up -d --build --remove-orphans
