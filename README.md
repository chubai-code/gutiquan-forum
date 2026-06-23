# 股票基金投资论坛

## 项目简介
本项目是《软件工程理论与实践》课程设计题目三“股票基金投资论坛”的实现方案。系统面向股票、基金、宏观策略和新手投资交流场景，提供用户注册登录、板块分类、发帖评论、点赞收藏、关注粉丝、群组讨论、搜索推荐、内容审核、积分等级、数据统计等功能。

## 技术栈
- 前端：HTML5 + CSS3 + JavaScript，使用 Vite 作为开发服务器。
- 后端：Node.js + Express，采用 RESTful API。
- 数据库：SQLite，提供 schema.sql 初始化脚本。
- 鉴权：JWT Token。
- 测试：Jest + Supertest，接口测试用例见 docs/test.md。

## 团队成员
| 角色 | 姓名 | 学号 | GitHub用户名 | 职责 |
|---|---|---|---|---|
| 组长 | 梁浩 | U202411120 | chubai-code | 项目统筹、后端开发、数据库设计 |
| 组员 | 沈昊 | U202415065 | shenhao717 | 后端开发、前端开发 |
| 组员 | 杨祯祎 | U202412090 | - | 数据库设计 |
| 组员 | 梁宇星 | U202410857 | Yuxing-Liang | 后端开发 |
| 组员 | 乐家杰 | U202416959 | ljj200507079155-jpg | 测试与文档 |

## 仓库目录结构
```text
stock-fund-forum/
├── README.md
├── docs/
│   ├── user_stories.md
│   ├── use_cases.md
│   ├── ai.md
│   ├── assign.md
│   ├── architect.md
│   ├── ui_design.md
│   ├── backend_api.md
│   ├── db.md
│   ├── test.md
│   ├── install.md
│   └── user_guid.md
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── auth.js
│   │   └── seed.js
│   └── sql/schema.sql
└── frontend/
    ├── package.json
    ├── index.html
    ├── src/main.js
    └── src/style.css
```

## 快速启动
1. 进入 backend，执行 `npm install`。
2. 执行 `npm run init-db` 初始化数据库。
3. 执行 `npm run dev` 启动后端，默认端口 8080。
4. 进入 frontend，执行 `npm install`。
5. 执行 `npm run dev` 启动前端，默认端口 5173。
6. 浏览器访问 `http://localhost:5173`。

## 默认账号
- 普通用户：`demo@example.com` / `123456`
- 管理员：`admin@example.com` / `admin123`

## AI 使用说明
本项目允许 AI 辅助生成需求、设计、代码框架和测试用例，但所有内容均经过人工审查、改写、补充和调试。AI 使用过程记录见 `docs/ai.md`。
