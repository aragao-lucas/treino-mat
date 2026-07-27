// auth.js - gerenciamento simples de usuários em localStorage
(function(){
  const KEY_USERS = 'tm_users';
  const KEY_CURRENT = 'tm_currentUser';

  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem(KEY_USERS) || '[]') }catch(e){ return [] }
  }
  function saveUsers(users){ localStorage.setItem(KEY_USERS, JSON.stringify(users)) }

  function getCurrent(){ return JSON.parse(localStorage.getItem(KEY_CURRENT) || 'null') }
  function setCurrent(user){ localStorage.setItem(KEY_CURRENT, JSON.stringify(user)) }
  function clearCurrent(){ localStorage.removeItem(KEY_CURRENT) }

  // expose current user and auth check
  window.getCurrentUser = function(){ return getCurrent(); };
  window.isAuthenticated = function(){ return !!getCurrent(); };

  function findByEmail(email){ return loadUsers().find(u => u.email.toLowerCase()===email.toLowerCase()) }

  window.registerUser = function(name,email,password){
    if(findByEmail(email)) return { ok:false, message:'Já existe usuário com esse e-mail' }
    const users = loadUsers();
    const user = { id: Date.now(), name, email, password, score: 0 };
    users.push(user); saveUsers(users); setCurrent(user);
    return { ok:true, user };
  }

  window.loginUser = function(email,password){
    const user = findByEmail(email);
    if(!user) return { ok:false, message:'E-mail não cadastrado' };
    if(user.password !== password) return { ok:false, message:'Senha incorreta' };
    setCurrent(user); return { ok:true, user };
  }

  window.logoutUser = function(){ clearCurrent(); }

  window.updateProfile = function(changes){
    const users = loadUsers();
    const cur = getCurrent();
    if(!cur) return { ok:false, message:'Não autenticado' };
    const idx = users.findIndex(u=>u.id===cur.id);
    if(idx<0) return { ok:false, message:'Usuário não encontrado' };
    const updated = Object.assign({}, users[idx], changes);
    users[idx] = updated; saveUsers(users); setCurrent(updated);
    return { ok:true, user:updated };
  }

  // score helpers per user
  window.getScore = function(){
    const cur = getCurrent(); return cur ? (cur.score || 0) : 0;
  }

  window.resetScore = function(){
    const users = loadUsers(); const cur = getCurrent();
    if(!cur) return { ok:false, message:'Não autenticado' };
    const idx = users.findIndex(u=>u.id===cur.id);
    if(idx<0) return { ok:false, message:'Usuário não encontrado' };
    users[idx].score = 0; saveUsers(users); setCurrent(users[idx]);
    // also clear quiz high scores. Remove both global keys and user-specific keys
    try{
      const ops = ['add','sub','mul','div','premium'];
      const levels = [1,2,3];
      ops.forEach(op=> levels.forEach(l=> {
        const keyGlobal = `highScore_${op}_${l}`;
        localStorage.removeItem(keyGlobal);
        try{
          if(cur && cur.id){
            const keyUser = `highScore_${op}_${l}_${cur.id}`;
            localStorage.removeItem(keyUser);
          }
        }catch(e){ /* ignore per-user key */ }
      }));
    }catch(e){ /* ignore */ }
    return { ok:true, score:0 };
  }

  window.addScore = function(points){
    const users = loadUsers(); const cur = getCurrent();
    if(!cur) return { ok:false, message:'Não autenticado' };
    const idx = users.findIndex(u=>u.id===cur.id);
    if(idx<0) return { ok:false, message:'Usuário não encontrado' };
    const pts = Number(points) || 0;
    users[idx].score = (users[idx].score || 0) + pts; saveUsers(users); setCurrent(users[idx]);
    return { ok:true, score: users[idx].score };
  }

  // UI helpers
  function showNav(){
    const cur = getCurrent();
    const a = document.getElementById('nav-profile');
    const l = document.getElementById('nav-logout');
    if(a && l){
      if(cur){ a.style.display='inline'; l.style.display='inline'; } else { a.style.display='none'; l.style.display='none'; }
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    showNav();

    const logout = document.getElementById('nav-logout');
    if(logout) logout.addEventListener('click', function(e){ e.preventDefault(); logoutUser(); showNav(); window.location.href='index.html'; });

    // login form
    const loginForm = document.getElementById('login-form');
    if(loginForm){
      loginForm.addEventListener('submit', function(e){
        e.preventDefault();
        const email = loginForm.querySelector('input[name=email]').value.trim();
        const pass = loginForm.querySelector('input[name=password]').value;
        const out = loginUser(email, pass);
        const msg = document.getElementById('login-msg');
            if(!out.ok){ if(msg) msg.textContent = out.message; return; }
            const params = new URLSearchParams(window.location.search);
            const next = params.get('next');
            window.location.href = next || 'profile.html';
      });
    }

    // register form
    const regForm = document.getElementById('register-form');
    if(regForm){
      regForm.addEventListener('submit', function(e){
        e.preventDefault();
        const name = regForm.querySelector('input[name=name]').value.trim();
        const email = regForm.querySelector('input[name=email]').value.trim();
        const pass = regForm.querySelector('input[name=password]').value;
        const pass2 = regForm.querySelector('input[name=confirm]').value;
        const msg = document.getElementById('register-msg');
        if(!name || !email || !pass){ msg.textContent='Preencha todos os campos'; return; }
        if(pass !== pass2){ msg.textContent='As senhas não conferem'; return; }
        const out = registerUser(name,email,pass);
        if(!out.ok){ msg.textContent = out.message; return; }
            const params = new URLSearchParams(window.location.search);
            const next = params.get('next');
            window.location.href = next || 'profile.html';
      });
    }

    // profile page logic
    const profileBox = document.getElementById('profile-box');
    if(profileBox){
      const cur = getCurrent();
      if(!cur){ window.location.href='login.html'; return; }
      profileBox.querySelector('#p-name').textContent = cur.name || '';
      profileBox.querySelector('#p-email').textContent = cur.email || '';
      const pscore = profileBox.querySelector('#p-score'); if(pscore) pscore.textContent = (cur.score || 0);

      // update form
      const upd = document.getElementById('profile-form');
      if(upd){
        upd.querySelector('input[name=name]').value = cur.name || '';
        upd.addEventListener('submit', function(e){
          e.preventDefault();
          const name = upd.querySelector('input[name=name]').value.trim();
          const pass = upd.querySelector('input[name=password]').value;
          const changes = { name };
          if(pass) changes.password = pass;
          const out = updateProfile(changes);
          const msg = document.getElementById('profile-msg');
          if(!out.ok){ if(msg) msg.textContent = out.message; return; }
          if(msg) { msg.style.color='green'; msg.textContent='Perfil atualizado'; }
          // refresh displayed
          profileBox.querySelector('#p-name').textContent = out.user.name;
        });
      }

      const btnLogout = document.getElementById('btn-logout');
      if(btnLogout) btnLogout.addEventListener('click', function(){ logoutUser(); window.location.href='index.html'; });

      const btnReset = document.getElementById('btn-reset-score');
      if(btnReset){ btnReset.addEventListener('click', function(){ const out = resetScore(); if(out.ok){ const p = profileBox.querySelector('#p-score'); if(p) p.textContent = out.score; const msg = document.getElementById('profile-msg'); if(msg){ msg.style.color='green'; msg.textContent='Score redefinido'; setTimeout(()=>msg.textContent='',2000); } } }); }
    }
  });

})();
