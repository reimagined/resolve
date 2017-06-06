#!/bin/sh
docker-compose up --build -d
exit_code=$(docker wait todo_testcafe_1)
docker logs todo_testcafe_1
docker-compose down --rmi all
exit $exit_code
