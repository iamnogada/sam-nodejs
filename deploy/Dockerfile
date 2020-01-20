FROM node:alpine
# Add an docker user, make work dir
RUN adduser --disabled-password --gecos "" docker && \
  echo "docker ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
  mkdir -p /home/docker/mvp-sample-front && \
  chown docker:docker /home/docker/mvp-sample-front

WORKDIR /home/docker/mvp-sample-front

COPY . ./

RUN npm install

# RUN as docker user
USER docker
CMD node app