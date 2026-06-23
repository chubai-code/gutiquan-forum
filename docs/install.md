# 软件安装文档 install.md

## 1. 环境要求
- Node.js 18.x 或以上。
- npm 9.x 或以上。
- Git 可选，用于克隆仓库。
- 浏览器：Chrome、Edge、Firefox 均可。

## 2. 获取项目
将项目文件夹复制到本地，例如：
```bash
cd D:\course-design
```
或在 Linux/CentOS 中：
```bash
cd /root/course-design
```

## 3. 后端安装与启动
```bash
cd backend
npm install
npm run init-db
npm run dev
```
启动成功后，后端地址为：
```text
http://localhost:8080
```
健康检查：
```text
http://localhost:8080/api/health
```

## 4. 前端安装与启动
打开新终端：
```bash
cd frontend
npm install
npm run dev
```
启动成功后，访问：
```text
http://localhost:5173
```

## 5. 默认账号
普通用户：
```text
邮箱：demo@example.com
密码：123456
```
管理员：
```text
邮箱：admin@example.com
密码：admin123
```

## 6. 常见问题
1. 端口被占用：修改 backend/src/app.js 中的 PORT，或关闭占用端口的程序。
2. 数据库不存在：执行 `npm run init-db` 初始化数据库。
3. 前端请求失败：确认后端已经启动，并检查 API 地址是否为 `http://localhost:8080/api`。
4. npm install 速度慢：可切换 npm 镜像源。

## 7. 部署说明
课程设计要求本地部署，本项目已满足本地部署要求。若部署到云服务器，可使用 Nginx 托管前端静态文件，使用 PM2 启动 Node.js 后端，并将 SQLite 替换为 MySQL 或 PostgreSQL。
