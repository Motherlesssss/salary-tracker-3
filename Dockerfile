FROM artifactory.ep.chehejia.com/licloud-docker/base/run/nginx:1.14.2-alpine-20220426

# 将静态文件复制到 Nginx 默认静态目录
COPY . /usr/share/nginx/html/

# 删除默认配置，避免端口冲突
RUN rm -f /etc/nginx/conf.d/default.conf && \
    echo 'server { \
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
