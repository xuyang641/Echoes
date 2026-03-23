# 阿里云企业级部署架构指南 (Enterprise Deployment on Aliyun)

对于追求**长期运营稳定、数据安全可控以及符合国内合规要求（ICP备案）**的项目，使用阿里云（或腾讯云）等头部云厂商是最佳选择。

由于 Echoes 项目深度依赖了 Supabase（包含 PostgreSQL, Auth, Storage, Edge Functions），在阿里云上的最佳实践是**“自建 Supabase 实例” + “云原生静态托管”**。

---

## 1. 架构总览 (Architecture Overview)

| 组件 | 当前方案 (国际/小平台) | 阿里云企业级方案 | 优势 |
| :--- | :--- | :--- | :--- |
| **前端 Web/PWA** | Vercel / Zeabur | **阿里云 OSS + CDN** | 极致的加载速度，抗并发能力极强，成本极低。 |
| **数据库** | Supabase Cloud | **阿里云 RDS for PostgreSQL** | 每日自动备份、任意时间点恢复、高可用主备。 |
| **后端 API & Auth**| Supabase Cloud | **阿里云 ECS (Docker 部署 Supabase)** | 完全掌控用户数据，无 Vendor Lock-in（供应商绑定）。 |
| **文件存储 (图片)**| Supabase Storage | **阿里云 OSS (配置 S3 兼容)** | 海量存储，国内访问速度极快，结合 CDN 节省流量费。 |
| **AI 模型** | Google Gemini / OpenAI| **阿里云百炼 (通义千问)** | 国内顶尖大模型，合规且稳定，接口响应延迟极低。 |
| **地图服务** | Mapbox | **高德地图 (阿里系)** | 国内最准确的 LBS 服务，完全合规。 |

---

## 2. 详细部署步骤

### 2.1 前端静态托管 (OSS + CDN)
这是国内托管 React 单页应用 (SPA) 最稳定且成本最低的方式。
1. 在阿里云开通 **对象存储 OSS**，创建一个 Bucket（例如 `echoes-web`），权限设置为**公共读**。
2. 在 Bucket 设置中，配置 **静态页面**：
   - 默认首页：`index.html`
   - 404 页面：`index.html` （非常重要，用于支持 React Router 的单页路由）。
3. 开通 **CDN (内容分发网络)**，绑定你的已备案域名（如 `app.yourdomain.com`），源站指向该 OSS Bucket。
4. **发布流程**：
   ```bash
   npm run build
   # 使用阿里云 ossutil 工具一键上传
   ossutil cp -r dist/ oss://echoes-web/ --update
   ```

### 2.2 后端服务 (自建 Supabase)
为了不重写业务代码，我们需要在阿里云上运行开源版的 Supabase。
1. **购买 ECS (云服务器)**：推荐 2核 4G 以上配置，安装 Ubuntu/Debian。
2. **购买 RDS (关系型数据库)**：购买 PostgreSQL 15 实例，用于替代 Supabase 内置的本地数据库，保障数据绝对安全。
3. **通过 Docker 部署**：
   - SSH 登录 ECS，安装 Docker 和 Docker Compose。
   - 克隆 Supabase 官方的 Docker 部署仓库：
     ```bash
     git clone https://github.com/supabase/supabase
     cd supabase/docker
     ```
   - 修改 `.env` 文件，将数据库连接指向你的**阿里云 RDS**。
   - 修改 Storage 配置，将其 S3 兼容接口指向你的**阿里云 OSS**。
   - 运行 `docker-compose up -d` 启动所有服务。
4. **配置反向代理**：在 ECS 上使用 Nginx 绑定后端域名（如 `api.yourdomain.com`），并配置 SSL 证书。

### 2.3 AI 服务 (阿里云百炼)
1. 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/)。
2. 获取 API Key。
3. 在客户端代码或 `.env` 中配置：
   ```env
   VITE_AI_PROVIDER=aliyun
   VITE_AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
   VITE_AI_API_KEY=你的百炼_API_KEY
   VITE_AI_MODEL=qwen-plus
   ```

---

## 3. 合规与运营建议 (Compliance)

1. **域名与 ICP 备案**：
   - 国内服务器必须进行 ICP 备案。通过阿里云购买域名并在控制台提交备案申请（通常需 7-14 天）。
   - 备案期间，可以先使用服务器 IP 进行内部测试。
2. **公安联网备案**：
   - ICP 备案完成后 30 日内，需在全国公安机关互联网站安全管理服务平台进行公安备案。
3. **数据隐私合规**：
   - App 涉及收集用户日记、位置和照片。必须在 App 启动时弹出《隐私政策》和《用户协议》，否则无法在国内应用商店（华为、小米、OV）上架。
4. **内容安全审核 (重要)**：
   - 作为一个 UGC（用户生成内容）应用，国内运营必须具备内容审核机制。
   - 建议接入 **阿里云内容安全 (Content Moderation)**，在用户保存日记或上传图片前进行自动化违规词/涉黄涉政图片检测，避免平台被封停。

---

## 4. 成本估算 (首年预估)

- **ECS 服务器 (2核4G)**: 约 ¥1500 - ¥2000 / 年 (视带宽而定)
- **RDS PostgreSQL (基础版)**: 约 ¥1000 - ¥1500 / 年
- **OSS + CDN (存储与流量)**: 按量付费，前期约 ¥10 - ¥50 / 月
- **AI Token 消耗 (通义千问)**: 按使用量计费（Qwen-Plus 价格极低，前期几乎可忽略）
- **总计**: 约 ¥3000 - ¥4000 / 年（适合正式商业化运营）。
*(注：如果是个人运营早期，可以暂时不买 RDS，直接将数据库部署在 ECS 的 Docker 里，成本可降至 ¥1500/年以内)*