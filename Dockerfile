FROM artifactory.ep.chehejia.com/licloud-docker/base/run/nginx:1.14.2-alpine-20220426

# 将静态文件复制到 Nginx 默认静态目录
COPY . /usr/share/nginx/html/

# 直接创建 Nginx 配置文件，固定使用 8080 端口
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 创建日志目录并设置权限
RUN mkdir -p /chj/data/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html/

EXPOSE 8080

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
