FROM python:3.9-alpine

ENV PYTHONUNBUFFERED=1

WORKDIR /backend
COPY ./backend/requirements.txt .

RUN apk add --update --no-cache postgresql-client && \
    apk add --update --no-cache --virtual .tmp-deps \
      build-base postgresql-dev musl-dev linux-headers libffi-dev && \
    pip install -r requirements.txt && \
    apk del .tmp-deps && \
    adduser --disabled-password --no-create-home backend

COPY ./backend .

USER backend
