FROM node:15.12.0-alpine3.10

RUN apk add --no-cache \
      coreutils \
      g++ \
      gcc \
      git \
      eudev-dev \
      make \
      python-dev \
      libstdc++6

ENV OPENZWAVE_VERSION=e7b1705403fced2c2d2bc8aa92b559f6351f5542

RUN cd /root \
    && git clone https://github.com/OpenZWave/open-zwave.git \
    && cd /root/open-zwave \
    && git checkout ${OPENZWAVE_VERSION} \
    && make \
    && cd /root/open-zwave \
    && make install \
    && rm -rf /root/open-zwave

RUN mkdir /driver

COPY package.json /driver

WORKDIR /driver

RUN yarn install

CMD yarn live
