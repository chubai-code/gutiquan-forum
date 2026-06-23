import './style.css';
const API = 'http://localhost:8080/api';
let token = localStorage.getItem('token') || '';
let state = { boards: [], posts: [], boardId: '', keyword: '', user: null, view: 'home', currentPost: null, comments: [] };

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  return data.data;
}

async function load() {
  state.boards = await request('/boards');
  await loadPosts();
  if (token) { try { state.user = await request('/users/me'); } catch { token=''; localStorage.removeItem('token'); } }
  render();
}
async function loadPosts() {
  const qs = new URLSearchParams();
  if (state.boardId) qs.set('boardId', state.boardId);
  if (state.keyword) qs.set('keyword', state.keyword);
  state.posts = await request('/posts?' + qs.toString());
}
async function login() {
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;
  const data = await request('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
  token = data.token; localStorage.setItem('token', token); state.user = data.user; state.view='home'; await loadPosts(); render();
}
async function submitPost() {
  const body = { boardId: Number(document.querySelector('#boardId').value), title: document.querySelector('#title').value, content: document.querySelector('#content').value, postType: document.querySelector('#postType').value, stockTags: document.querySelector('#stockTags').value };
  const data = await request('/posts', { method:'POST', body: JSON.stringify(body) });
  alert(data.status === 'pending' ? '内容已进入审核：' + data.reason : '发布成功');
  state.view='home'; await loadPosts(); render();
}
async function openPost(id) {
  state.currentPost = await request('/posts/' + id);
  state.comments = await request(`/posts/${id}/comments`);
  state.view='detail'; render();
}
async function addComment() {
  const content = document.querySelector('#comment').value;
  await request(`/posts/${state.currentPost.id}/comments`, { method:'POST', body: JSON.stringify({ content }) });
  await openPost(state.currentPost.id);
}
async function toggle(id, type) {
  await request(`/posts/${id}/${type}`, { method:'POST' });
  await loadPosts(); render();
}
function logout(){ token=''; localStorage.removeItem('token'); state.user=null; render(); }

function renderHome(){
  const boards = state.boards.map(b=>`<div class="board ${String(b.id)===String(state.boardId)?'active':''}" data-board="${b.id}">${b.name}<br><small>${b.post_count||0}帖</small></div>`).join('');
  const posts = state.posts.map(p=>`<div class="card"><div class="post-title" data-post="${p.id}">${p.title}</div><div>${p.content.slice(0,100)}...</div><div>${(p.stock_tags||'').split(',').filter(Boolean).map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="meta">${p.nickname} · ${p.board_name} · 浏览 ${p.view_count} · 评论 ${p.comment_count} · 点赞 ${p.like_count}</div><button class="btn secondary" data-like="${p.id}">点赞</button><button class="btn secondary" data-fav="${p.id}">收藏</button></div>`).join('');
  return `<div class="container"><aside><div class="card"><h3>板块</h3><div class="board" data-board="">全部</div>${boards}</div></aside><main><div class="card"><button class="btn" id="newPost">发布帖子</button><span class="notice">论坛内容仅供学习交流，不构成投资建议。</span></div>${posts}</main><aside><div class="card"><h3>热门话题</h3><p>#指数基金 #A股反弹 #宏观策略 #量化投资</p></div><div class="card"><h3>活跃作者</h3><p>演示用户、管理员、基金研究员</p></div></aside></div>`;
}
function renderLogin(){ return `<div class="container"><main class="card"><h2>登录</h2><input id="email" class="input" value="demo@example.com" placeholder="邮箱"><input id="password" class="input" type="password" value="123456" placeholder="密码"><button id="loginBtn" class="btn">登录</button><p class="meta">管理员：admin@example.com / admin123</p></main></div>`; }
function renderEditor(){ return `<div class="container"><main class="card"><h2>发布帖子</h2><select id="boardId">${state.boards.map(b=>`<option value="${b.id}">${b.name}</option>`)}</select><select id="postType"><option value="normal">普通帖子</option><option value="article">长文分析</option><option value="poll">投票调研</option><option value="flash">实时讨论</option></select><input id="title" class="input" placeholder="标题"><input id="stockTags" class="input" placeholder="股票/基金标签，用逗号分隔"><textarea id="content" placeholder="正文"></textarea><p class="notice">请勿发布保证收益、内幕消息、操纵市场等违规内容。</p><button id="submitPost" class="btn">提交</button></main></div>`; }
function renderDetail(){ const p=state.currentPost; return `<div class="container"><main><div class="card"><h2>${p.title}</h2><div class="meta">${p.nickname} · ${p.verify_status} · ${p.board_name} · ${p.created_at}</div><p>${p.content}</p><p>${(p.stock_tags||'').split(',').filter(Boolean).map(t=>`<span class="tag">${t}</span>`).join('')}</p><p class="notice">风险提示：本文仅代表作者个人观点，不构成投资建议。</p></div><div class="card"><h3>评论</h3>${state.comments.map(c=>`<p><b>${c.nickname}</b>：${c.content}</p>`).join('')}<textarea id="comment" placeholder="写评论"></textarea><button id="commentBtn" class="btn">发布评论</button></div></main></div>`; }
function render(){
  document.querySelector('#app').innerHTML = `<div class="header"><div class="logo">股票基金投资论坛</div><input class="search" id="search" value="${state.keyword}" placeholder="搜索关键词、用户、股票代码"><div>${state.user?`你好，${state.user.nickname} <button class="btn secondary" id="logout">退出</button>`:`<button class="btn" id="goLogin">登录</button>`}</div></div>${state.view==='login'?renderLogin():state.view==='editor'?renderEditor():state.view==='detail'?renderDetail():renderHome()}<div class="footer">课程设计演示系统 · 投资有风险，交流需谨慎</div>`;
  bind();
}
function bind(){
  document.querySelector('#goLogin')?.addEventListener('click',()=>{state.view='login';render();});
  document.querySelector('#logout')?.addEventListener('click',logout);
  document.querySelector('#loginBtn')?.addEventListener('click',()=>login().catch(e=>alert(e.message)));
  document.querySelector('#newPost')?.addEventListener('click',()=>{ if(!token) {state.view='login'} else {state.view='editor'} render();});
  document.querySelector('#submitPost')?.addEventListener('click',()=>submitPost().catch(e=>alert(e.message)));
  document.querySelector('#commentBtn')?.addEventListener('click',()=>addComment().catch(e=>alert(e.message)));
  document.querySelectorAll('[data-board]').forEach(el=>el.addEventListener('click',async()=>{state.boardId=el.dataset.board; await loadPosts(); render();}));
  document.querySelectorAll('[data-post]').forEach(el=>el.addEventListener('click',()=>openPost(el.dataset.post)));
  document.querySelectorAll('[data-like]').forEach(el=>el.addEventListener('click',()=>toggle(el.dataset.like,'like').catch(e=>alert(e.message))));
  document.querySelectorAll('[data-fav]').forEach(el=>el.addEventListener('click',()=>toggle(el.dataset.fav,'favorite').catch(e=>alert(e.message))));
  document.querySelector('#search')?.addEventListener('keydown',async e=>{ if(e.key==='Enter'){ state.keyword=e.target.value; await loadPosts(); render(); }});
}
load().catch(e=>{ document.querySelector('#app').innerHTML = `<pre>启动失败：${e.message}
请确认后端已执行 npm run init-db 和 npm run dev</pre>`; });
