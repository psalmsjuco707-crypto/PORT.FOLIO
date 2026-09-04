// ===== DEFAULT DATA =====
const defaultProjects = [
  {
    id: 1,
    title: "C++ Hello World",
    desc: "A simple C++ program with output.",
    type: "cpp",
    image: "",
    code: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}'
  },
  {
    id: 2,
    title: "Interactive Web Card",
    desc: "A live HTML/CSS/JS component you can edit and preview instantly.",
    type: "web",
    image: "",
    html: '<div class="card"><h2>Hello!</h2><p>Click me</p></div>',
    css: '.card { padding: 2rem; background: linear-gradient(135deg, #ff8c28, #d4af37); border-radius: 12px; color: #000; text-align: center; cursor: pointer; transition: transform 0.3s; } .card:hover { transform: scale(1.05); }',
    js: 'document.querySelector(".card").addEventListener("click", () => alert("Clicked!"));'
  }
];

const defaultFeedbacks = [
  { 
    id: 1, 
    name: "Alex Johnson", 
    role: "Product Manager", 
    text: "Psalms delivered an outstanding UI/UX design that exceeded our expectations. His attention to detail and creative vision transformed our product completely.",
    date: "Aug 15, 2026",
    hearts: 12,
    heartedByUser: false,
    comments: [
      { id: 101, name: "Sarah Lee", text: "Totally agree! His work is phenomenal.", date: "Aug 16, 2026" }
    ]
  },
  {
    id: 2,
    name: "Maria Santos",
    role: "Classmate",
    text: "Working with Psalms on our group projects was a great experience. He's reliable, creative, and always willing to help.",
    date: "Jul 22, 2026",
    hearts: 8,
    heartedByUser: false,
    comments: []
  }
];

// ===== LOCAL STORAGE =====
function getData(key, defaults) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaults;
  } catch(e) { return defaults; }
}
function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

let projects = getData('portfolio_projects', defaultProjects);
let feedbacks = getData('portfolio_feedbacks', defaultFeedbacks);
let isAdmin = false;
let currentViewerProject = null;
let currentViewerTab = null;

// ===== 3D TILT EFFECT =====
function init3DTilt() {
  const cards = document.querySelectorAll('.project-card, .feedback-card, .whatido-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

// ===== RENDER PROJECTS =====
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  projects.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card reveal visible';
    card.onclick = (e) => {
      if (e.target.closest('.delete-btn')) return;
      openViewer(proj.id);
    };

    const imgHtml = proj.image 
      ? `<img src="${proj.image}" alt="${proj.title}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 200%22><rect fill=%22%23141414%22 width=%22400%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2220%22>No Image</text></svg>';">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg3);color:var(--muted);font-size:0.9rem;">📷 No Image</div>`;

    card.innerHTML = `
      <button class="delete-btn" onclick="event.stopPropagation(); deleteProject(${proj.id})">🗑 Delete</button>
      <button class="delete-btn" style="right: 80px; background: var(--accent); color: #000;" onclick="event.stopPropagation(); editProject(${proj.id})">✏️ Edit</button>
      <div class="project-img">
        ${imgHtml}
      </div>
      <div class="project-info">
        <span class="project-type-badge ${proj.type === 'cpp' ? 'cpp' : ''}">${proj.type === 'cpp' ? '⚙️ C++' : '🌐 Web'}</span>
        <h3>${proj.title}</h3>
        <p>${proj.desc}</p>
      </div>
    `;
    grid.appendChild(card);
  });
  init3DTilt();
}

// ===== PROJECT VIEWER =====
function openViewer(projectId) {
  const proj = projects.find(p => p.id === projectId);
  if (!proj) return;
  currentViewerProject = proj;

  document.getElementById('viewerTitle').textContent = proj.title;
  document.getElementById('viewerDesc').textContent = proj.desc;
  document.getElementById('viewerIcon').textContent = proj.type === 'cpp' ? '⚙️' : '🌐';

  const isWeb = proj.type === 'web';
  document.getElementById('viewerFullscreenBtn').style.display = 'inline-flex';
  document.getElementById('viewerFullscreenBtn').innerHTML = '⛶ Fullscreen';
  document.getElementById('viewerNewTabBtn').style.display = isWeb ? 'inline-flex' : 'none';
  
  if (document.fullscreenElement) document.exitFullscreen();

  const tabs = document.getElementById('viewerTabs');
  tabs.innerHTML = '';

  if (proj.type === 'cpp') {
    const tab = document.createElement('button');
    tab.className = 'viewer-tab active';
    tab.textContent = 'main.cpp';
    tab.onclick = () => switchViewerTab('cpp', tab);
    tabs.appendChild(tab);
    currentViewerTab = 'cpp';
    document.getElementById('viewerCodeDisplay').textContent = proj.code || '';
    document.getElementById('previewLabel').textContent = '💻 Terminal Output';
    document.getElementById('viewerPreview').innerHTML = '<div class="cpp-output">Click "▶ Run" to compile and execute.</div>';
  } else {
    const files = [
      { key: 'html', label: 'index.html' },
      { key: 'css', label: 'style.css' },
      { key: 'js', label: 'script.js' }
    ];
    files.forEach((file, i) => {
      const tab = document.createElement('button');
      tab.className = 'viewer-tab' + (i === 0 ? ' active' : '');
      tab.textContent = file.label;
      tab.onclick = () => switchViewerTab(file.key, tab);
      tabs.appendChild(tab);
    });
    currentViewerTab = 'html';
    document.getElementById('viewerCodeDisplay').textContent = proj.html || '';
    document.getElementById('previewLabel').textContent = '🔍 Live Preview';
    renderWebPreview(proj);
  }

  document.getElementById('projectViewer').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function switchViewerTab(key, tabEl) {
  document.querySelectorAll('.viewer-tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  currentViewerTab = key;
  const proj = currentViewerProject;
  if (!proj) return;
  document.getElementById('viewerCodeDisplay').textContent = (proj.type === 'cpp') ? (proj.code || '') : (proj[key] || '');
}

// ===== FIXED: SMART WEB PREVIEW (Allows full interactivity) =====
function renderWebPreview(proj) {
  const preview = document.getElementById('viewerPreview');
  preview.innerHTML = '';

  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.minHeight = '400px';
  iframe.style.border = 'none';
  iframe.style.backgroundColor = '#ffffff';
  iframe.style.pointerEvents = 'auto';
  
  // ✅ SMART SANDBOX: Allows scripts, forms, modals, and same-origin access
  // but prevents navigation to parent frames
  iframe.sandbox = 'allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation';
  
  // 🔒 SMART NAVIGATION GUARD: Only blocks actual page escapes, allows internal JS navigation
  const navigationGuard = `
    <script>
      (function() {
        // Only intercept links that would actually navigate away
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) {
            const href = link.getAttribute('href') || '';
            // Only block links that explicitly try to escape the iframe
            if (href === 'index.html' || href === '../index.html' || 
                href === '/' || href === '../' || href === '../../') {
              e.preventDefault();
              e.stopPropagation();
              console.log('Blocked navigation attempt:', href);
              return false;
            }
            // Allow all other links (including # for JS-driven navigation)
            link.setAttribute('target', '_self');
          }
        }, true);
        
        // Allow forms to submit within the iframe
        document.addEventListener('submit', function(e) {
          if (!e.target.getAttribute('target')) {
            e.target.setAttribute('target', '_self');
          }
        }, true);
        
        // Prevent window.open from escaping
        const originalOpen = window.open;
        window.open = function(url, name, features) {
          if (url && (url.includes('index.html') || url === '/' || url === '../')) {
            console.log('Blocked window.open attempt:', url);
            return null;
          }
          return originalOpen.call(window, url, name, features);
        };
      })();
    <\/script>
  `;
  
  const source = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_self">
  <style>
    body { margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    ${proj.css || ''}
  </style>
</head>
<body>
  ${proj.html || ''}
  ${navigationGuard}
  <script>
    try { 
      ${proj.js || ''} 
    } catch(e) { 
      console.error('Project JS Error:', e); 
      document.body.innerHTML += '<div style="color:red; padding:20px; background:#ffebee; border:1px solid red; border-radius:4px; margin:20px; font-family:sans-serif;"><strong>JS Error in Project:</strong><br>' + e.message + '</div>';
    }
  <\/script>
</body>
</html>`;
  
  iframe.srcdoc = source;
  preview.appendChild(iframe);
}

function toggleViewerFullscreen() {
  const panel = document.getElementById('viewerPreviewPanel');
  if (!document.fullscreenElement) {
    panel.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}
document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('viewerFullscreenBtn');
  if (btn) btn.innerHTML = document.fullscreenElement ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
});

// ===== FIXED: SMART NEW TAB OPENING =====
function openInNewTab() {
  const proj = currentViewerProject;
  if (!proj || proj.type !== 'web') return;
  
  const navigationGuard = `
    <script>
      (function() {
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) {
            const href = link.getAttribute('href') || '';
            if (href === 'index.html' || href === '../index.html' || 
                href === '/' || href === '../' || href === '../../') {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            link.setAttribute('target', '_self');
          }
        }, true);
        document.addEventListener('submit', function(e) {
          if (!e.target.getAttribute('target')) {
            e.target.setAttribute('target', '_self');
          }
        }, true);
      })();
    <\/script>
  `;
  
  const source = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_self">
  <style>
    body { margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    ${proj.css || ''}
  </style>
</head>
<body>
  ${proj.html || ''}
  ${navigationGuard}
  <script>
    try { ${proj.js || ''} } catch(e) { console.error(e); }
  <\/script>
</body>
</html>`;
  const blob = new Blob([source], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function closeViewer() {
  if (document.fullscreenElement) document.exitFullscreen();
  document.getElementById('projectViewer').classList.remove('active');
  document.body.style.overflow = '';
  currentViewerProject = null;
}

// ===== C++ INTERPRETER =====
function smartCppInterpret(code) {
  let output = '';
  let vars = {};
  code = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith('#') || line.startsWith('using ') || line === '' || line === '{' || line === '}' || line.startsWith('return') || line.startsWith('int main') || line.startsWith('void main')) continue;
    const declMatch = line.match(/^(int|double|float|char|long)\s+(\w+)\s*(?:=\s*(.+?))?\s*;?$/);
    if (declMatch) { vars[declMatch[2]] = declMatch[3] !== undefined ? resolveExpression(declMatch[3], vars) : 0; continue; }
    const assignMatch = line.match(/^(\w+)\s*=\s*(.+?)\s*;?$/);
    if (assignMatch && !line.includes('cout') && !line.includes('cin')) { vars[assignMatch[1]] = resolveExpression(assignMatch[2], vars); continue; }
    const cinMatch = line.match(/cin\s*>>\s*(\w+)/);
    if (cinMatch) { const input = prompt(`📥 Program needs input (cin >> ${cinMatch[1]}):`); vars[cinMatch[1]] = isNaN(input) ? input : Number(input); continue; }
    const coutMatch = line.match(/cout\s*<<\s*(.+?)\s*;?$/);
    if (coutMatch) {
      const parts = coutMatch[1].split('<<');
      for (let part of parts) {
        part = part.trim();
        if (part === 'endl' || part === '"\\n"') output += '\n';
        else if (part.startsWith('"') && part.endsWith('"')) output += part.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
        else if (part.startsWith("'") && part.endsWith("'")) output += part.slice(1, -1);
        else if (vars.hasOwnProperty(part)) output += vars[part];
        else { try { output += resolveExpression(part, vars); } catch(e) { output += part; } }
      }
    }
  }
  return output;
}

function resolveExpression(expr, vars) {
  expr = expr.trim();
  if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
  if (!isNaN(expr) && expr !== '') return Number(expr);
  if (vars.hasOwnProperty(expr)) return vars[expr];
  let mathExpr = expr;
  for (const [key, val] of Object.entries(vars)) { mathExpr = mathExpr.replace(new RegExp('\\b' + key + '\\b', 'g'), val); }
  try { return Function('"use strict"; return (' + mathExpr + ')')(); } catch(e) { return expr; }
}

async function runViewerCode() {
  const proj = currentViewerProject;
  if (!proj) return;
  const btn = document.getElementById('viewerRunBtn');
  const preview = document.getElementById('viewerPreview');
  if (proj.type === 'web') {
    renderWebPreview(proj);
    btn.innerHTML = '✓ Refreshed';
    setTimeout(() => { btn.innerHTML = '▶ Run'; }, 1500);
    return;
  }
  btn.disabled = true;
  btn.innerHTML = '⏳ Compiling...';
  let outputText = '';
  const updateOutput = (text) => {
    outputText = text;
    const formatted = outputText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
    preview.innerHTML = `<div class="cpp-output">${formatted}</div>`;
  };
  updateOutput('$ g++ main.cpp -o main\n');
  await new Promise(r => setTimeout(r, 600));
  updateOutput(outputText + '$ ./main\n');
  await new Promise(r => setTimeout(r, 400));
  let jscppWorked = false;
  if (typeof JSCPP !== 'undefined') {
    try {
      let jscppOutput = outputText;
      const exitCode = JSCPP.run(proj.code || '', '', {
        stdio: {
          write: function(s) { jscppOutput += s; updateOutput(jscppOutput); },
          read: function() { const input = prompt('📥 Program needs input (cin):'); return (input !== null ? input : '') + '\n'; }
        }
      });
      updateOutput(jscppOutput + `\n[Process exited with code ${exitCode}]`);
      jscppWorked = true;
    } catch(e) { 
      console.log('JSCPP failed:', e);
      updateOutput(outputText + `\n[JSCPP Error: ${e.message}]\n`);
    }
  }
  if (!jscppWorked) {
    try {
      const result = smartCppInterpret(proj.code || '');
      updateOutput(outputText + result + '\n\n[Process exited with code 0]');
    } catch(e) { updateOutput(outputText + `\n[Error]: ${e.message || e}`); }
  }
  btn.disabled = false;
  btn.innerHTML = '▶ Run Again';
}

// ===== MODAL & FORM HANDLING =====
function openProjectModal(projectId = null) {
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
  if (!modal || !form) return;
  
  const preview = document.getElementById('projImagePreview');
  const base64Input = document.getElementById('projImageBase64');
  const fileInput = document.getElementById('projImageFile');
  
  fileInput.value = '';
  
  if (projectId) {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('projId').value = proj.id;
    document.getElementById('projTitle').value = proj.title;
    document.getElementById('projDesc').value = proj.desc;
    document.getElementById('projType').value = proj.type;
    
    if (proj.image && proj.image.startsWith('data:image')) {
      preview.src = proj.image;
      base64Input.value = proj.image;
    } else {
      preview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%23141414" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%23888" font-size="20">Click to Upload</text></svg>';
      base64Input.value = proj.image || '';
    }
    
    if (proj.type === 'cpp') document.getElementById('projCode').value = proj.code || '';
    else if (proj.type === 'web') {
      document.getElementById('projHtml').value = proj.html || '';
      document.getElementById('projCss').value = proj.css || '';
      document.getElementById('projJs').value = proj.js || '';
    }
    toggleCodeFields();
  } else {
    document.getElementById('modalTitle').textContent = 'Add New Project';
    form.reset();
    document.getElementById('projId').value = '';
    preview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%23141414" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%23888" font-size="20">Click to Upload</text></svg>';
    base64Input.value = '';
    toggleCodeFields();
  }
  modal.classList.add('active');
}

function editProject(id) { openProjectModal(id); }
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}
function toggleCodeFields() {
  const type = document.getElementById('projType').value;
  document.getElementById('codeFieldsCpp').style.display = type === 'cpp' ? 'block' : 'none';
  document.getElementById('codeFieldsWeb').style.display = type === 'web' ? 'block' : 'none';
}

// Image upload handler
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('projImageFile');
  const preview = document.getElementById('projImagePreview');
  const base64Input = document.getElementById('projImageBase64');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.src = ev.target.result;
          base64Input.value = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

function saveProject(event) {
  event.preventDefault();
  const id = document.getElementById('projId').value;
  const type = document.getElementById('projType').value;
  const projectData = {
    id: id ? parseInt(id) : Date.now(),
    title: document.getElementById('projTitle').value,
    desc: document.getElementById('projDesc').value,
    type: type,
    image: document.getElementById('projImageBase64').value || ''
  };
  if (type === 'cpp') projectData.code = document.getElementById('projCode').value;
  else if (type === 'web') {
    projectData.html = document.getElementById('projHtml').value;
    projectData.css = document.getElementById('projCss').value;
    projectData.js = document.getElementById('projJs').value;
  }
  if (id) {
    const index = projects.findIndex(p => p.id === parseInt(id));
    if (index !== -1) projects[index] = projectData;
  } else {
    projects.push(projectData);
  }
  saveData('portfolio_projects', projects);
  renderProjects();
  closeModal('projectModal');
}

function deleteProject(id) {
  if (confirm('Delete this project?')) {
    projects = projects.filter(p => p.id !== id);
    saveData('portfolio_projects', projects);
    renderProjects();
  }
}

function exportProjects() {
  const dataStr = 'const defaultProjects = ' + JSON.stringify(projects, null, 2) + ';';
  navigator.clipboard.writeText(dataStr).then(() => {
    alert('✅ Copied! Replace defaultProjects in portfolio.js with this.');
  }).catch(() => alert('Failed to copy.'));
}

// ===== HEART REACTIONS =====
function toggleHeart(feedbackId) {
  const fb = feedbacks.find(f => f.id === feedbackId);
  if (!fb) return;
  fb.heartedByUser = !fb.heartedByUser;
  fb.hearts = (fb.hearts || 0) + (fb.heartedByUser ? 1 : -1);
  if (fb.hearts < 0) fb.hearts = 0;
  saveData('portfolio_feedbacks', feedbacks);
  
  const heartBtn = document.querySelector(`[data-heart-id="${feedbackId}"]`);
  if (heartBtn) {
    heartBtn.classList.add('heart-pop');
    setTimeout(() => heartBtn.classList.remove('heart-pop'), 400);
    if (fb.heartedByUser) createHeartBurst(heartBtn);
  }
  renderFeedbacks();
}

function createHeartBurst(element) {
  const rect = element.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className = 'heart-burst';
  burst.style.left = (rect.left + rect.width/2) + 'px';
  burst.style.top = (rect.top + rect.height/2) + 'px';
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1000);
}

// ===== FEEDBACK COMMENTS =====
function toggleCommentSection(feedbackId) {
  const section = document.getElementById(`comments-${feedbackId}`);
  if (!section) return;
  section.classList.toggle('open');
}

function addCommentToFeedback(feedbackId, event) {
  event.preventDefault();
  const fb = feedbacks.find(f => f.id === feedbackId);
  if (!fb) return;
  
  const nameInput = document.getElementById(`cmt-name-${feedbackId}`);
  const textInput = document.getElementById(`cmt-text-${feedbackId}`);
  
  if (!fb.comments) fb.comments = [];
  fb.comments.push({
    id: Date.now(),
    name: nameInput.value.trim() || 'Anonymous',
    text: textInput.value.trim(),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  });
  
  saveData('portfolio_feedbacks', feedbacks);
  renderFeedbacks();
  
  setTimeout(() => {
    const section = document.getElementById(`comments-${feedbackId}`);
    if (section) section.classList.add('open');
  }, 50);
}

function deleteComment(feedbackId, commentId) {
  const fb = feedbacks.find(f => f.id === feedbackId);
  if (!fb || !fb.comments) return;
  fb.comments = fb.comments.filter(c => c.id !== commentId);
  saveData('portfolio_feedbacks', feedbacks);
  renderFeedbacks();
  setTimeout(() => {
    const section = document.getElementById(`comments-${feedbackId}`);
    if (section) section.classList.add('open');
  }, 50);
}

// ===== RENDER FEEDBACKS =====
function renderFeedbacks() {
  const grid = document.getElementById('feedbacksGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  feedbacks.forEach(fb => {
    const card = document.createElement('div');
    card.className = 'feedback-card reveal visible';
    const heartCount = fb.hearts || 0;
    const commentCount = (fb.comments || []).length;
    const isHearted = fb.heartedByUser || false;
    
    const commentsList = (fb.comments || []).map(c => `
      <div class="inline-comment">
        <div class="inline-comment-avatar">${c.name.charAt(0).toUpperCase()}</div>
        <div class="inline-comment-body">
          <div class="inline-comment-head">
            <strong>${escapeHtml(c.name)}</strong>
            <span class="inline-comment-date">${c.date || ''}</span>
            ${isAdmin ? `<button class="inline-comment-del" onclick="deleteComment(${fb.id}, ${c.id})" title="Delete">✕</button>` : ''}
          </div>
          <p>${escapeHtml(c.text)}</p>
        </div>
      </div>
    `).join('');
    
    card.innerHTML = `
      <button class="delete-btn" onclick="deleteFeedback(${fb.id})">🗑 Delete</button>
      <p class="feedback-text">${escapeHtml(fb.text)}</p>
      <div class="feedback-author">
        <div class="author-avatar">${fb.name.charAt(0).toUpperCase()}</div>
        <div class="author-info">
          <h4>${escapeHtml(fb.name)}</h4>
          <span>${escapeHtml(fb.role)}${fb.date ? ' • ' + fb.date : ''}</span>
        </div>
      </div>
      <div class="feedback-reactions">
        <button class="reaction-btn ${isHearted ? 'hearted' : ''}" data-heart-id="${fb.id}" onclick="toggleHeart(${fb.id})" aria-label="Like">
          <svg class="heart-svg" viewBox="0 0 24 24" fill="${isHearted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span class="reaction-count">${heartCount}</span>
        </button>
        <button class="reaction-btn comment-toggle" onclick="toggleCommentSection(${fb.id})" aria-label="Comments">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="reaction-count">${commentCount}</span>
        </button>
      </div>
      <div class="feedback-comments-section" id="comments-${fb.id}">
        <div class="comments-list">
          ${commentCount === 0 ? '<p class="no-comments">No comments yet. Be the first!</p>' : commentsList}
        </div>
        <form class="inline-comment-form" onsubmit="addCommentToFeedback(${fb.id}, event)">
          <input type="text" id="cmt-name-${fb.id}" placeholder="Your name" required maxlength="50">
          <textarea id="cmt-text-${fb.id}" placeholder="Write a comment..." rows="2" required maxlength="500"></textarea>
          <button type="submit" class="inline-comment-submit">Post</button>
        </form>
      </div>
    `;
    grid.appendChild(card);
  });
  init3DTilt();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function addPublicComment(event) {
  event.preventDefault();
  feedbacks.unshift({
    id: Date.now(),
    name: document.getElementById('commentName').value,
    role: document.getElementById('commentRole').value || 'Visitor',
    text: document.getElementById('commentText').value,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    hearts: 0,
    heartedByUser: false,
    comments: []
  });
  saveData('portfolio_feedbacks', feedbacks);
  renderFeedbacks();
  event.target.reset();
  alert('✅ Comment posted!');
}

function deleteFeedback(id) {
  if (confirm('Delete?')) {
    feedbacks = feedbacks.filter(f => f.id !== id);
    saveData('portfolio_feedbacks', feedbacks);
    renderFeedbacks();
  }
}

function clearAllComments() {
  if (confirm('Delete ALL comments?')) {
    feedbacks = [];
    saveData('portfolio_feedbacks', feedbacks);
    renderFeedbacks();
  }
}

function toggleAdminMode() {
  if (!isAdmin) {
    if (prompt('Enter admin password:') === 'PsalmsJuco_23') {
      isAdmin = true;
      document.body.classList.add('admin-mode');
      renderProjects(); renderFeedbacks();
      alert('✅ Admin Mode Enabled.');
    }
  } else {
    isAdmin = false;
    document.body.classList.remove('admin-mode');
    renderProjects(); renderFeedbacks();
  }
}

// ===== SKILLS =====
const skillsData = {
  frontend: { title: 'Frontend Development', desc: 'Building responsive, fast, and beautiful user interfaces.', tags: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Tailwind CSS', 'TypeScript'] },
  backend: { title: 'Backend Development', desc: 'Designing robust APIs and server-side solutions.', tags: ['Node.js', 'Python', 'C++', 'SQL', 'REST APIs', 'MongoDB'] },
  design: { title: 'UI/UX Design', desc: 'Crafting visual experiences that users love.', tags: ['Figma', 'Adobe Photoshop', 'Prototyping', 'Wireframing', 'Design Systems'] },
  mobile: { title: 'Mobile Development', desc: 'Cross-platform mobile development.', tags: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'] }
};

function switchSkillTab(category, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const el = document.getElementById('skillsContent');
  if (!el) return;
  const d = skillsData[category];
  el.innerHTML = `<h3>${d.title}</h3><p>${d.desc}</p><div class="skill-tags">${d.tags.map(t => `<span>${t}</span>`).join('')}</div>`;
  el.style.animation = 'none';
  setTimeout(() => { el.style.animation = 'fadeIn 0.5s ease'; }, 10);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderProjects();
  renderFeedbacks();
  const firstTab = document.querySelector('.tab-btn');
  if (firstTab) switchSkillTab('frontend', firstTab);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
  });

  const pc = document.getElementById('particles');
  if (pc) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      if (Math.random() > 0.5) p.classList.add('silver');
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (Math.random() * 10 + 10) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
      pc.appendChild(p);
    }
  }

  const sp = document.getElementById('scrollProgress');
  const bt = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    const pct = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    sp.style.width = pct + '%';
    bt.classList.toggle('visible', window.pageYOffset > 400);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeViewer(); closeModal('projectModal'); }
  });

  // ===== CURSOR GLOW & CUSTOM SWORD CURSOR LOGIC =====
  const cursorGlow = document.getElementById('cursorGlow');
  const customCursor = document.getElementById('customCursor');
  
  document.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--cursor-x', Math.round(e.clientX));
    document.documentElement.style.setProperty('--cursor-y', Math.round(e.clientY));
    
    if (cursorGlow) {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    }
  });

  const clickables = document.querySelectorAll('a, button, .project-card, .feedback-card, input, textarea, select, .btn, .tab-btn, .social-icon, .add-btn, .reaction-btn, .viewer-action-btn, .inline-comment-submit, .close-modal, .file-label, .whatido-card');
  clickables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (customCursor) customCursor.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      if (customCursor) customCursor.classList.remove('hovering');
    });
  });

  // ===== FIXED: ROBUST CONTACT FORM WITH AD-BLOCKER FALLBACK =====
  const cf = document.querySelector('.contact-form');
  if (cf) {
    cf.addEventListener('submit', async function(e) {
      e.preventDefault();
      const st = document.getElementById('formStatus');
      const sb = cf.querySelector('button[type="submit"]');
      
      sb.disabled = true; 
      sb.innerHTML = '⏳ Sending...';
      st.style.display = 'block'; 
      st.style.color = '#fbbf24'; 
      st.textContent = 'Sending...';
      
      try {
        const formData = new FormData(cf);
        const r = await fetch(cf.action, { 
          method: 'POST', 
          body: formData, 
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        const data = await r.json();
        
        if (r.ok && data.success) { 
          st.style.color = '#4ade80'; 
          st.textContent = '✅ Message Sent Successfully!'; 
          cf.reset(); 
        } else { 
          st.style.color = '#ef4444'; 
          st.textContent = '❌ Error: ' + (data.message || 'Form not activated. Check your email spam folder for an activation link from FormSubmit.'); 
        }
      } catch (err) { 
        st.style.color = '#ef4444'; 
        st.textContent = '❌ Network Error. This is usually caused by an Ad-Blocker (like uBlock or Brave Shields) blocking FormSubmit. Please disable it temporarily or check your email to activate the form first.'; 
        console.error('FormSubmit fetch error:', err);
        
        // Fallback: try native form submission if fetch is completely blocked by browser
        setTimeout(() => {
          if(confirm("Fetch failed (likely due to an Ad-Blocker). Try submitting the form normally? This will redirect you to a confirmation page.")) {
            cf.submit(); // Native submission bypasses fetch CORS/ad-blocker issues
          }
        }, 1000);
      }
      
      sb.disabled = false; 
      sb.innerHTML = 'Send Message <span class="btn-arrow">→</span>';
      setTimeout(() => { st.style.display = 'none'; }, 8000);
    });
  }
});

window.onclick = function(e) {
  if (e.target === document.getElementById('projectModal')) closeModal('projectModal');
};
