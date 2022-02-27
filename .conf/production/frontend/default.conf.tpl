server {
    listen       ${SERVER_PORT};
    listen  [::]:${SERVER_PORT};
    server_name  ${SERVER_HOST};


    location / {
        root                    /usr/share/nginx/html;
        index                   index.html index.htm;
        try_files               $uri $uri/ /index.html;
    }

    location /api {
        uwsgi_pass              ${BACKEND_PROXY};
        include                 /etc/nginx/uwsgi_params;
        client_max_body_size    10M;
    }
}

