server {
    listen 80;

    root /usr/share/nginx/html;
    index index.html index.htm;

    # Serve React routes
    location / {
        try_files $uri /index.html;
    }

    # Proxy API requests to backend container
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: enable gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;
}
