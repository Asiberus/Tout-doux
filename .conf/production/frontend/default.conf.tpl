# Server configuration for frontend
server {
    listen          ${SERVER_PORT};
    listen     [::]:${SERVER_PORT};
    server_name     ${SERVER_HOST};

    access_log      /var/log/nginx/front/access.log;
    error_log       /var/log/nginx/front/error.log warn;

    location / {
        root                    /usr/share/nginx/html;
        index                   index.html index.htm;
        try_files               $uri $uri/ /index.html;
    }
}

# Server configuration for backend API (reverse proxy)
server {
    listen          ${SERVER_PORT};
    listen     [::]:${SERVER_PORT};
    server_name     ${API_HOST};

    access_log      /var/log/nginx/api/access.log;
    error_log       /var/log/nginx/api/error.log warn;

    location / {
        uwsgi_pass              ${BACKEND_PROXY};
        include                 /etc/nginx/uwsgi_params;
        client_max_body_size    10M;
    }

    location /static {
        alias /vol/static;
    }
}
