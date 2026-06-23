# 测试报告文档 test.md

## 1. 测试目标
验证股票基金投资论坛的核心功能是否满足课程设计需求，包括注册登录、板块浏览、发帖评论、点赞收藏、关注、搜索、审核和数据统计。测试重点覆盖正常流程、异常输入、权限控制和内容合规。

## 2. 测试环境
- 操作系统：Windows 10 / CentOS / macOS 均可。
- Node.js：18.x 及以上。
- 后端端口：8080。
- 前端端口：5173。
- 数据库：SQLite 本地文件 forum.db。
- 测试工具：浏览器、Postman、Jest、Supertest。

## 3. 单元测试设计
| 编号 | 测试对象 | 输入 | 预期结果 |
|---|---|---|---|
| UT-01 | auth.hashPassword | 明文密码 123456 | 返回非空哈希且不等于明文 |
| UT-02 | auth.comparePassword | 正确密码和哈希 | 返回 true |
| UT-03 | auth.comparePassword | 错误密码和哈希 | 返回 false |
| UT-04 | sensitiveCheck | 包含“稳赚不赔” | 返回 pending 和风险原因 |
| UT-05 | sensitiveCheck | 普通交流内容 | 返回 published |

## 4. 接口测试用例
| 编号 | 接口 | 场景 | 步骤 | 预期结果 |
|---|---|---|---|---|
| API-01 | POST /api/auth/register | 正常注册 | 输入新邮箱、昵称、密码 | 返回用户信息 |
| API-02 | POST /api/auth/register | 重复邮箱 | 使用已存在邮箱注册 | 返回错误提示 |
| API-03 | POST /api/auth/login | 正常登录 | 输入正确邮箱密码 | 返回 Token |
| API-04 | POST /api/auth/login | 密码错误 | 输入错误密码 | 返回 401 |
| API-05 | GET /api/boards | 查询板块 | 访问接口 | 返回板块列表 |
| API-06 | POST /api/posts | 未登录发帖 | 不带 Token 请求 | 返回 401 |
| API-07 | POST /api/posts | 正常发帖 | 带 Token 提交标题正文 | 返回帖子 ID |
| API-08 | POST /api/posts | 敏感词发帖 | 正文含“保证收益” | 状态为 pending |
| API-09 | GET /api/posts | 搜索帖子 | keyword=基金 | 返回匹配帖子 |
| API-10 | POST /api/posts/{id}/comments | 评论 | 带 Token 评论 | 评论数增加 |
| API-11 | POST /api/posts/{id}/like | 点赞 | 第一次点击 | 点赞数增加 |
| API-12 | POST /api/posts/{id}/like | 取消点赞 | 第二次点击 | 点赞数减少 |
| API-13 | POST /api/users/{id}/follow | 关注用户 | 关注其他用户 | 关注关系建立 |
| API-14 | GET /api/admin/audits | 普通用户访问 | 普通用户 Token | 返回 403 |
| API-15 | GET /api/admin/audits | 管理员访问 | 管理员 Token | 返回审核列表 |

## 5. 功能测试用例
| 编号 | 功能 | 测试步骤 | 预期结果 |
|---|---|---|---|
| FT-01 | 首页展示 | 打开前端首页 | 显示板块、热榜、帖子列表 |
| FT-02 | 登录流程 | 输入 demo 账号登录 | 显示当前用户昵称 |
| FT-03 | 发帖流程 | 登录后发布帖子 | 帖子出现在列表中 |
| FT-04 | 评论流程 | 进入帖子详情并评论 | 评论显示在评论区 |
| FT-05 | 收藏流程 | 点击收藏按钮 | 收藏状态改变 |
| FT-06 | 搜索流程 | 输入“基金”搜索 | 列表只显示相关内容 |
| FT-07 | 管理审核 | 管理员进入审核页 | 可查看待审核内容 |

## 6. 缺陷与修复记录
| 缺陷 | 原因 | 修复方式 |
|---|---|---|
| 重复点赞会插入多条记录 | 缺少唯一约束 | 增加 reactions 唯一约束并采用 toggle 逻辑 |
| 普通用户可访问审核接口 | 路由未校验角色 | 添加 requireAdmin 中间件 |
| 敏感词帖子直接发布 | 审核函数未接入发帖流程 | 在 createPost 前调用 sensitiveCheck |
| 搜索大小写不一致 | SQL 查询未统一处理 | 使用 lower(title/content) 模糊查询 |

## 7. 测试结论
核心业务流程可以正常运行，系统满足课程设计中“前端+后端+数据库”的基本要求。权限控制、重复操作、防违规内容和主要异常流程均已覆盖。后续可继续增加自动化测试覆盖率、附件上传安全扫描和全文搜索引擎集成。
