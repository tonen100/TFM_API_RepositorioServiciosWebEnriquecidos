docker login
docker run -d -p 80:80 --name nginx-proxy -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy
docker network create service-tier
docker network connect service-tier nginx-proxy