# 国内初期免费/极低成本部署指南 (Free & Low-Cost Initial Deployment in China)

在项目初期（测试验证阶段、积累首批种子用户阶段），完全可以采用**免费方案**或**极低成本方案**进行国内部署。

我们的核心策略是：**白嫖国内大厂的免费额度 + 使用成熟的 Serverless 平台**，且保持架构的灵活性，确保未来随时可以平滑迁移到正规的阿里云/腾讯云付费企业级架构。

---

## 1. 方案总览：如何做到 0 元起步？

| 组件 | 推荐免费方案 | 为什么可行？ | 免费额度/限制 |
| :--- | :--- | :--- | :--- |
| **前端部署** | **Gitee Pages** 或 **Vercel (绑定国内直连域名)** | 国内直接访问速度快，无需购买服务器。 | 免费。Gitee Pages 需实名认证。Vercel 需自己有个未被墙的域名。 |
| **数据库 & 后端** | **MemFire Cloud (国内版 Supabase)** | 完全兼容 Supabase API，国内节点，速度快。 | 免费版提供 500MB 数据库，1GB 存储，10万次/月 API 调用，足够初期使用。 |
| **AI 模型** | **阿里云百炼 (通义千问 Qwen-Plus)** | 国内目前最慷慨的大模型平台。 | 新用户注册赠送 **几百万 Token**（足够跑几个月），后续价格也非常低（1块钱100万Token）。 |
| **地图服务** | **高德地图 Web JS API** | 阿里系，国内标准。 | 个人开发者免费额度（每日数万次调用），足够初期使用。 |

---

## 2. 具体操作步骤 (Step-by-Step)

### 第一步：搞定数据库和后端 API (使用 MemFire Cloud - 免费)
1. **注册 MemFire**：访问 [MemFire Cloud 官网](https://memfire.com/)，使用微信或手机号注册。
2. **创建应用**：在控制台点击“创建应用”，选择免费版（开发版）。
3. **获取凭证**：进入应用详情页，在“应用设置” -> “API设置”中，复制 `URL` 和 `anon key`。
4. **初始化数据表**：
   - 进入 MemFire 的“SQL执行器”。
   - 将你本地 `e:\photo dairy` 目录下的 `supabase_schema.sql` 和 `setup_profiles_v2.sql` 的内容复制进去并执行，完成表的创建。
5. **本地配置**：
   - 打开项目中的 `.env` 文件。
   - 将刚才获取的凭证填入：
     ```env
     VITE_SUPABASE_URL=你的_MemFire_URL
     VITE_SUPABASE_ANON_KEY=你的_MemFire_Anon_Key
     ```
*(注：此时你的本地代码已经连上了国内的数据库，无需修改任何 TypeScript 代码！)*

### 第二步：搞定 AI 助手 (使用阿里云百炼 - 免费白嫖 Token)
1. **开通百炼**：访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 并登录。
2. **获取 API Key**：在控制台右上角点击你的头像，进入“API-KEY 管理”，创建一个新的 Key。
3. **本地配置**：
   - 打开 `.env` 文件，添加以下配置：
     ```env
     VITE_AI_PROVIDER=aliyun
     VITE_AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
     VITE_AI_API_KEY=刚刚获取的_API_KEY
     VITE_AI_MODEL=qwen-plus
     ```

### 第三步：前端线上部署 (使用 Vercel + 国内直连域名 - 极低成本)
由于 Gitee Pages 不支持自定义路由（会导致 React 单页应用刷新 404），最完美的方案依然是 Vercel，只是我们需要解决“国内访问被墙”的问题。

**解决方案：花几块钱买个域名，让 Vercel 绕过墙。**
1. **购买域名**：去腾讯云/阿里云买一个最便宜的域名（例如 `.top` 或 `.xyz` 后缀，首年通常只要 **9 块钱**）。**注意：不需要备案！**
2. **部署到 Vercel**：
   - 将代码推送到 GitHub。
   - 在 Vercel 中导入该 GitHub 仓库，默认设置直接点击 Deploy（Vercel 是完全免费的）。
3. **绑定你的域名**：
   - 在 Vercel 项目设置中找到 "Domains"，添加你刚买的域名（例如 `diary.yourname.top`）。
4. **修改 DNS 解析 (关键步骤)**：
   - 去你买域名的云服务商（腾讯云/阿里云）的 DNS 解析控制台。
   - 添加一条 `CNAME` 记录，将你的域名指向 `cname-china.vercel-dns.com`（这是 Vercel 官方提供的中国大陆优化的 CNAME 节点，国内可以直连访问，不会被墙）。
5. **完成**：现在，国内用户通过 `diary.yourname.top` 就能以极快的速度访问你的应用了！

---

## 3. 初期方案的局限性与升级时机

这套方案（MemFire 免费版 + Vercel 直连 + 阿里云百炼免费额度）**每月的硬性成本为 0 元**（除了首年 9 块钱的域名费）。

**什么时候你需要考虑升级到 [DEPLOY_ALIYUN.md](./DEPLOY_ALIYUN.md) 中的付费方案？**
1. **存储空间不够**：用户的照片越来越多，MemFire 免费版的 1GB 存储满了。
2. **并发量变大**：每天有几百个活跃用户，MemFire 免费版的 API 调用次数达到上限，或者 Vercel 的免费带宽不够用了。
3. **需要上架国内安卓应用商店**：各大应用商店（华为、小米）强制要求你的服务器必须有 **ICP 备案**。由于 Vercel 是海外服务器，无法备案。此时你必须购买国内的阿里云 ECS 服务器来走备案流程。
4. **数据绝对隐私**：你希望用户的所有日记和照片只存在你自己的服务器上，不放在 MemFire 这样的第三方平台上。

**平滑升级**：因为代码完全没变，未来升级时，你只需要将 `.env` 里的 `VITE_SUPABASE_URL` 换成你自己在阿里云 ECS 上部署的 Supabase 地址，将前端代码打包放到阿里云 OSS 即可。