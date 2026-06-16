FROM ubuntu:latest
LABEL authors="borah"

ENTRYPOINT ["top", "-b"]