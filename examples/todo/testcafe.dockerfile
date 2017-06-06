FROM testcafe/testcafe
USER root

COPY ./testcafe ./tests

RUN mkdir -p $HOME && \
    cd ./tests/ && \
    npm install chai --silent
