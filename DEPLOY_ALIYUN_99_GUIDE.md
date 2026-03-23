# 阿里云 99元轻量服务器实战部署指南 (Step-by-Step Guide)

这篇文档将手把手教你如何在一台全新的阿里云 **2核2G** 轻量应用服务器上，部署 **Supabase (后端 + 数据库)** 和 **Nginx (前端页面)**。

---

## 准备工作
1. 购买阿里云 99元/年轻量应用服务器。
2. 操作系统选择 **Ubuntu 22.04** 或更高版本。
3. 在阿里云控制台的“防火墙/安全组”中，放行以下端口：
   - `80` (HTTP)
   - `443` (HTTPS)
   - `8000` (Supabase API 默认端口)
   - `5432` (PostgreSQL 默认端口，建议改掉或仅限本地访问)

---

## 第一阶段：服务器基础环境配置

通过 SSH 连接到你的服务器（Mac/Linux 用终端，Windows 用 PowerShell 或 Xshell）。

```bash
ssh root@你的服务器公网IP
```

### 1. 更新系统并安装基础软件
```bash
apt update && apt upgrade -y
apt install -y git curl wget unzip
```

### 2. 安装 Docker 和 Docker Compose
Supabase 官方强烈推荐使用 Docker 部署。
```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动并设置开机自启
systemctl enable docker
systemctl start docker

# 安装 Docker Compose
apt install docker-compose-plugin -y
```

---

## 第二阶段：部署私有化 Supabase

由于我们的服务器是 2核2G 的轻量级机器，直接跑完整的 Supabase（包含各种监控和边缘函数）可能会导致内存溢出。因此，我们需要跑一个**精简版**。

### 1. 获取 Supabase Docker 配置文件
```bash
cd ~
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

### 2. 配置环境变量
```bash
cp .env.example .env
```
使用 `vim .env` 编辑文件，**必须修改**以下关键配置：
- `POSTGRES_PASSWORD`: 随便生成一个强密码。
- `JWT_SECRET`: 生成一个长的随机字符串（非常重要！）。
- `ANON_KEY` 和 `SERVICE_ROLE_KEY`: （可选）你可以自己用刚才的 JWT_SECRET 生成，或者先用默认的测试。
- `SITE_URL`: 修改为你的域名或公网 IP，例如 `http://你的服务器IP:8000`。

### 3. 精简组件 (关键！防止 2G 内存崩溃)
默认的 `docker-compose.yml` 包含很多吃内存的组件（如 vector, imgproxy, logflare）。
你可以编辑 `docker-compose.yml`，**注释掉或删除**以下服务：
- `vector`
- `imgproxy` (如果不做图片实时裁剪)
- `logflare` (日志分析，初期不需要)
- `analytics` (数据分析平台)

### 4. 启动 Supabase
```bash
docker compose up -d
```
等待大约 3-5 分钟，让所有容器启动完毕。
你可以运行 `docker ps` 查看状态。此时，你的后端 API 已经运行在 `http://你的服务器IP:8000` 上了！

---

## 第三阶段：部署前端应用 (Nginx)

现在我们要把本地电脑上打包好的前端页面放到这台服务器上。

### 1. 在本地电脑打包代码
在你的本地项目根目录（`e:\photo dairy`）下运行：
```bash
npm run build
```
这会生成一个 `dist` 文件夹。

### 2. 把 dist 文件夹传到服务器
打开一个新的本地终端，使用 `scp` 命令（将路径替换为你自己的）：
```bash
scp -r ./dist root@你的服务器公网IP:/var/www/echoes
```

### 3. 在服务器上安装并配置 Nginx
回到你的服务器 SSH 终端：
```bash
apt install nginx -y
```

创建一个 Nginx 配置文件：
```bash
vim /etc/nginx/sites-available/echoes
```
填入以下内容（这是为 React 单页应用优化的配置）：
```nginx
server {
    listen 80;
    server_name 你的域名或公网IP;

    root /var/www/echoes;
    index index.html;

    # 开启 gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 处理 React 路由刷新 404 的问题
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置并重启 Nginx：
```bash
ln -s /etc/nginx/sites-available/echoes /etc/nginx/sites-enabled/
# 删除默认的欢迎页
rm /etc/nginx/sites-enabled/default
# 重启
systemctl restart nginx
```

---

## 第四阶段：数据库建表与本地联调

### 1. 客户端连接配置
打开你本地开发环境中的 `.env.zh`（或 `.env`）文件，修改 URL：
```env
VITE_SUPABASE_URL=http://你的服务器公网IP:8000
VITE_SUPABASE_ANON_KEY=你在服务器.env里配置的ANON_KEY
```

### 2. 初始化数据表
你可以通过 DBeaver 或 Navicat 等数据库管理工具，连接到你服务器的 PostgreSQL 数据库（端口 5432，密码是你在 `.env` 设定的 `POSTGRES_PASSWORD`）。
连上后，执行你本地的 `supabase_schema.sql` 等建表脚本。

*(或者更简单：直接进入 Supabase Studio 面板 `http://你的服务器IP:8000/project/default/editor`，在网页 SQL 编辑器里执行建表语句。)*

---

## 恭喜！部署完成！🎉
现在，你在浏览器输入 `http://你的服务器公网IP`，就能看到跑在你自己专属服务器上的 Echoes 日记本了！所有产生的数据，都实实在在地存在这台机器的硬盘里。