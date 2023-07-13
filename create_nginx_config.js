const fs = require('fs');

const domain = process.argv[2];

const data = `user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;
    server_names_hash_bucket_size 64;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # Dropping SSLv3, ref: POODLE
    ssl_prefer_server_ciphers on;

    server {
        server_name ${domain};

        location / {
            proxy_pass http://localhost:8383;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        listen [::]:443 ssl;
        listen 443 ssl;
        ssl_certificate /etc/ssl/live/vector/fullchain.pem;
        ssl_certificate_key /etc/ssl/live/vector/privkey.pem;
    }

    server {
        if ($host = ${domain}) {
            return 301 https://$host$request_uri;
        }

        listen 80;
        listen [::]:80;

        server_name ${domain};
        return 404;
    }
}`

fs.writeFile('nginx.conf', data, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("File written successfully\n");
  }
});