FROM python:3.9-alpine

ENV PYTHONUNBUFFERED=1

WORKDIR /backend

COPY ./.conf/production/backend/run.sh /scripts/run.sh
ENV PATH="/scripts:$PATH"

COPY ./backend/requirements.txt .

RUN apk add --update --no-cache postgresql-client && \
    apk add --update --no-cache --virtual .tmp-deps \
      build-base postgresql-dev musl-dev linux-headers libffi-dev && \
    pip install -r requirements.txt && \
    apk del .tmp-deps && \
    adduser --disabled-password --no-create-home backend && \
    mkdir -p /vol/web/static && \
    chown -R backend:backend /vol && \
    chmod -R 755 /vol && \
    chmod -R +x /scripts

COPY ./backend .

USER backend
CMD ["run.sh"]
