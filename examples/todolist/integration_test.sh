#!/bin/sh
docker-compose up --build -d
exit_code=$(docker wait todolist_testcafe_1)
docker logs todolist_testcafe_1
docker-compose down --rmi all
exit $exit_code
