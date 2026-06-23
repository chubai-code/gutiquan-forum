# 后端接口文档 backend_api.md

## 1. 通用规范
基础地址：`http://localhost:8080/api`
请求格式：JSON。
认证方式：登录后在请求头中加入 `Authorization: Bearer <token>`。
统一响应：
```json
{ "code": 0, "message": "ok", "data": {} }
```
错误响应：
```json
{ "code": 400, "message": "参数错误" }
```

## 2. OpenAPI 3.0 YAML
```yaml
openapi: 3.0.3
info:
  title: 股票基金投资论坛 API
  version: 1.0.0
servers:
  - url: http://localhost:8080/api
paths:
  /auth/register:
    post:
      summary: 用户注册
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, nickname]
              properties:
                email: { type: string }
                password: { type: string }
                nickname: { type: string }
      responses:
        '200': { description: 注册成功 }
  /auth/login:
    post:
      summary: 用户登录
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string }
                password: { type: string }
      responses:
        '200': { description: 登录成功并返回 token }
  /boards:
    get:
      summary: 获取板块列表
      responses:
        '200': { description: 板块列表 }
    post:
      summary: 管理员创建板块
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 创建成功 }
  /posts:
    get:
      summary: 获取帖子列表
      parameters:
        - in: query
          name: boardId
          schema: { type: integer }
        - in: query
          name: keyword
          schema: { type: string }
      responses:
        '200': { description: 帖子列表 }
    post:
      summary: 创建帖子
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 创建成功 }
  /posts/{id}:
    get:
      summary: 获取帖子详情
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: integer }
      responses:
        '200': { description: 帖子详情 }
  /posts/{id}/comments:
    get:
      summary: 获取评论列表
      responses:
        '200': { description: 评论列表 }
    post:
      summary: 新增评论
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 评论成功 }
  /posts/{id}/like:
    post:
      summary: 点赞或取消点赞
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 操作成功 }
  /posts/{id}/favorite:
    post:
      summary: 收藏或取消收藏
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 操作成功 }
  /users/me:
    get:
      summary: 获取当前用户信息
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 当前用户 }
    put:
      summary: 修改个人资料
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 修改成功 }
  /users/{id}/follow:
    post:
      summary: 关注或取消关注用户
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 操作成功 }
  /groups:
    get:
      summary: 群组列表
      responses:
        '200': { description: 群组列表 }
    post:
      summary: 创建群组
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 创建成功 }
  /admin/audits:
    get:
      summary: 管理员获取待审核内容
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 审核队列 }
  /admin/audits/{id}:
    put:
      summary: 处理审核记录
      security: [{ bearerAuth: [] }]
      responses:
        '200': { description: 处理成功 }
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## 3. 主要接口说明
| 接口 | 方法 | 权限 | 说明 |
|---|---|---|---|
| /auth/register | POST | 游客 | 注册账号 |
| /auth/login | POST | 游客 | 登录并获取 Token |
| /boards | GET | 游客 | 查看板块 |
| /boards | POST | 管理员 | 新增板块 |
| /posts | GET | 游客 | 查询帖子 |
| /posts | POST | 用户 | 发布帖子 |
| /posts/{id}/comments | POST | 用户 | 评论帖子 |
| /posts/{id}/like | POST | 用户 | 点赞或取消 |
| /posts/{id}/favorite | POST | 用户 | 收藏或取消 |
| /users/me | GET/PUT | 用户 | 查看或修改个人资料 |
| /admin/audits | GET | 管理员 | 查看审核队列 |
