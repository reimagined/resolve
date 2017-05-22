FROM node:6.1

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# copy app code
COPY ./ /usr/src/app/

EXPOSE 8080

CMD [ "npm", "run", "start" ]
