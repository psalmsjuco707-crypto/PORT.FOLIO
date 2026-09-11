// ===== FIREBASE SETUP =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, increment, arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxf-ao-SmrZnKIhgopkO_F6CCIagiQTYs",
  authDomain: "shizukaportfolio.firebaseapp.com",
  projectId: "shizukaportfolio",
  storageBucket: "shizukaportfolio.firebasestorage.app",
  messagingSenderId: "143468476677",
  appId: "1:143468476677:web:91ee846efe048153189f6c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== LOCAL USER ID (For editing own comments) =====
let localUserId = localStorage.getItem('portfolio_user_id');
if (!localUserId) {
  localUserId = 'user_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('portfolio_user_id', localUserId);
}

let isAdmin = false;
let currentViewerProject = null;

// ===== DEFAULT DATA (Only used to seed the database on first run) =====
const defaultProjects = [
  {
    id: "1",
    title: "C++ Interactive Demos",
    desc: "Explore 10 interactive C++ demos compiled and running directly in your browser.",
    type: "web",
    externalUrl: "https://psalmsjuco707-crypto.github.io/C-Interactive-Platform/",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'><rect fill='%230a0a0a' width='400' height='200'/><text x='50%25' y='50%25' text-anchor='middle' fill='%23d4af37' font-size='20' font-family='monospace'>C++ Interactive Platform</text></svg>"
  },
  {
    id: "2",
    title: "Gym Membership Management System",
    desc: "A complete web-based gym management system with member tracking, membership plans, and attendance monitoring.",
    type: "web",
    externalUrl: "https://psalmsjuco707-crypto.github.io/Gym-Membership-Management-System/",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'><rect fill='%231a1a1a' width='400' height='200'/><text x='50%25' y='50%25' text-anchor='middle' fill='%23d4af37' font-size='20' font-family='sans-serif'>Gym Management 💪</text></svg>"
  }
];

const defaultFeedbacks = [
  { 
    id: "1", 
    name: "Alex Johnson", 
    role: "Product Manager", 
    text: "Psalms delivered an outstanding UI/UX design that exceeded our expectations.",
    date: "Aug 15, 2026",
    hearts: 12,
    heartedBy: ["user_example"],
    comments: []
  }
];

// ===== SEED DATABASE IF EMPTY =====
async function seedDatabase() {
  const projSnap = await onSnapshot(collection(db, "projects"), (snap) => {
    if (snap.empty) {
      defaultProjects.forEach(p => setDoc(doc(db, "projects", p.id), p));
    }
  }, { onlyOnce: true });

  const fbSnap = await onSnapshot(collection(db, "feedbacks"), (snap) => {
    if (snap.empty) {
      defaultFeedbacks.forEach(f => setDoc(doc(db, "feedbacks", f.id), f));
    }
  }, { onlyOnce: true });
}

// ===== REAL-TIME DATA LISTENERS =====
let projects = [];
let feedbacks = [];

function initDataListeners() {
  onSnapshot(collection(db, "projects"), (snapshot) => {
    projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProjects();
  });

  onSnapshot(collection(db, "feedbacks"), (snapshot) => {
    feedbacks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderFeedbacks();
  });
}

// ===== MOBILE OPTIMIZATION CHECK =====
const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (isDesktop) {
  // Initialize 3D tilt only on desktop
  init3DTilt();
  
  // Custom cursor logic (Desktop Only)
  const cursorGlow = document.getElementById('cursorGlow');
  const customCursor = document.getElementById('customCursor');
  
  document.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--cursor-x', Math.round(e.clientX));
    document.documentElement.style.setProperty('--cursor-y', Math.round(e.clientY));
    if (cursorGlow) {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    }
  }, { passive: true });

  const clickables = document.querySelectorAll('a, button, .project-card, .feedback-card, input, textarea, select, .btn, .tab-btn, .social-icon, .add-btn, .reaction-btn, .viewer-action-btn, .inline-comment-submit, .close-modal, .file-label, .whatido-card');
  clickables.forEach(el => {
    el.addEventListener('mouseenter', () => customCursor?.classList.add('hovering'));
    el.addEventListener('mouseleave', () => customCursor?.classList.remove('hovering'));
  });
} else {
  // Completely disable cursor elements on mobile to prevent lag
  const customCursor = document.getElementById('customCursor');
  if (customCursor) customCursor.style.display = 'none';
  const cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow) cursorGlow.style.display = 'none';
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
      if (e.target.closest('.delete-btn') || e.target.closest('.edit-btn')) return;
      openViewer(proj.id);
    };

    const imgHtml = proj.image 
      ? `<img src="${proj.image}" alt="${proj.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:var(--bg3); color:var(--muted); font-size:0.9rem;">📷 Image Error</div>`
      : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--bg3); color:var(--muted); font-size:0.9rem;">📷 No Image</div>`;

    const badgeText = proj.externalUrl ? '🔗 External' : '🌐 Web';
    const badgeClass = proj.externalUrl ? 'external' : '';

    card.innerHTML = `
      <button class="delete-btn" style="${isAdmin ? 'display:flex !important' : ''}" onclick="event.stopPropagation(); deleteProject('${proj.id}')">🗑 Delete</button>
      <button class="delete-btn edit-btn" style="${isAdmin ? 'display:flex !important' : ''}; right: 80px; background: var(--accent); color: #000;" onclick="event.stopPropagation(); openProjectModal('${proj.id}')">✏️ Edit</button>
      <div class="project-img">${imgHtml}</div>
      <div class="project-info">
        <span class="project-type-badge ${badgeClass}">${badgeText}</span>
        <h3>${proj.title}</h3>
        <p>${proj.desc}</p>
      </div>
    `;
    grid.appendChild(card);
  });
  if (isDesktop) init3DTilt();
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
    const userHasHearted = fb.heartedBy && fb.heartedBy.includes(localUserId);
    
    const commentsList = (fb.comments || []).map(c => {
      const isOwner = c.userId === localUserId || isAdmin;
      return `
        <div class="inline-comment">
          <div class="inline-comment-avatar">${c.name.charAt(0).toUpperCase()}</div>
          <div class="inline-comment-body">
            <div class="inline-comment-head">
              <strong>${escapeHtml(c.name)}</strong>
              <span class="inline-comment-date">${c.date || ''}</span>
              ${isOwner ? `<button class="inline-comment-del" onclick="deleteComment('${fb.id}', '${c.id}')" title="Delete">✕</button>` : ''}
            </div>
            <p>${escapeHtml(c.text)}</p>
          </div>
        </div>
      `;
    }).join('');
    
    card.innerHTML = `
      <button class="delete-btn" style="${isAdmin ? 'display:flex !important' : ''}" onclick="deleteFeedback('${fb.id}')">🗑 Delete</button>
      <p class="feedback-text">${escapeHtml(fb.text)}</p>
      <div class="feedback-author">
        <div class="author-avatar">${fb.name.charAt(0).toUpperCase()}</div>
        <div class="author-info">
          <h4>${escapeHtml(fb.name)}</h4>
          <span>${escapeHtml(fb.role)}${fb.date ? ' • ' + fb.date : ''}</span>
        </div>
      </div>
      <div class="feedback-reactions">
        <button class="reaction-btn ${userHasHearted ? 'hearted' : ''}" onclick="toggleHeart('${fb.id}')" aria-label="Like">
          <svg class="heart-svg" viewBox="0 0 24 24" fill="${userHasHearted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span class="reaction-count">${heartCount}</span>
        </button>
        <button class="reaction-btn comment-toggle" onclick="toggleCommentSection('${fb.id}')" aria-label="Comments">
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
        <form class="inline-comment-form" onsubmit="addCommentToFeedback('${fb.id}', event)">
          <input type="text" id="cmt-name-${fb.id}" placeholder="Your name" required maxlength="50">
          <textarea id="cmt-text-${fb.id}" placeholder="Write a comment..." rows="2" required maxlength="500"></textarea>
          <button type="submit" class="inline-comment-submit">Post</button>
        </form>
      </div>
    `;
    grid.appendChild(card);
  });
  if (isDesktop) init3DTilt();
}

// ===== ACTIONS (Real-time Firebase Updates) =====
async function toggleHeart(feedbackId) {
  const fb = feedbacks.find(f => f.id === feedbackId);
  if (!fb) return;
  if (!fb.heartedBy) fb.heartedBy = [];
  
  const fbRef = doc(db, "feedbacks", feedbackId);
  const userIndex = fb.heartedBy.indexOf(localUserId);
  
  if (userIndex === -1) {
    await updateDoc(fbRef, { hearts: increment(1), heartedBy: arrayUnion(localUserId) });
  } else {
    await updateDoc(fbRef, { hearts: increment(-1), heartedBy: arrayRemove(localUserId) });
  }
}

async function addCommentToFeedback(feedbackId, event) {
  event.preventDefault();
  const fb = feedbacks.find(f => f.id === feedbackId);
  if (!fb) return;
  
  const nameInput = document.getElementById(`cmt-name-${feedbackId}`);
  const textInput = document.getElementById(`cmt-text-${feedbackId}`);
  if (!fb.comments) fb.comments = [];
  
  fb.comments.push({
    id: 'cmt_' + Date.now(),
    name: nameInput.value.trim() || 'Anonymous',
    text: textInput.value.trim(),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    userId: localUserId
  });
  
  await updateDoc(doc(db, "feedbacks", feedbackId), { comments: fb.comments });
  nameInput.value = '';
  textInput.value = '';
  
  setTimeout(() => {
    const section = document.getElementById(`comments-${feedbackId}`);
    if (section) section.classList.add('open');
  }, 50);
}

async function deleteComment(feedbackId, commentId) {
  const fb = feedbacks.find(f => f.id === feedbackId);
  if (!fb || !fb.comments) return;
  fb.comments = fb.comments.filter(c => c.id !== commentId);
  await updateDoc(doc(db, "feedbacks", feedbackId), { comments: fb.comments });
}

async function deleteProject(id) {
  if (confirm('Delete this project?')) {
    await deleteDoc(doc(db, "projects", id));
  }
}

async function deleteFeedback(id) {
  if (confirm('Delete this feedback?')) {
    await deleteDoc(doc(db, "feedbacks", id));
  }
}

// ===== PROJECT MODAL & SAVING =====
function openProjectModal(projectId = null) {
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
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
    
    if (proj.image && proj.image.startsWith('data:image')) {
      preview.src = proj.image;
      base64Input.value = proj.image;
    } else {
      preview.src = proj.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%23141414" width="400" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%23888" font-size="20">Click to Upload</text></svg>';
      base64Input.value = proj.image || '';
    }
    
    if (proj.externalUrl) {
      document.getElementById('projType').value = 'external';
      document.getElementById('projExternalUrl').value = proj.externalUrl || '';
    } else {
      document.getElementById('projType').value = 'web';
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

function toggleCodeFields() {
  const type = document.getElementById('projType').value;
  document.getElementById('codeFieldsWeb').style.display = type === 'web' ? 'block' : 'none';
  document.getElementById('codeFieldsExternal').style.display = type === 'external' ? 'block' : 'none';
}

async function saveProject(event) {
  event.preventDefault();
  const id = document.getElementById('projId').value || 'proj_' + Date.now();
  const type = document.getElementById('projType').value;
  const externalUrlVal = document.getElementById('projExternalUrl').value;
  const imageBase64 = document.getElementById('projImageBase64').value;
  
  // ⚠️ FIRESTORE LIMIT WARNING: Documents cannot exceed 1MB. Base64 images can be large.
  if (imageBase64 && imageBase64.length > 800000) {
    alert("⚠️ Image is too large! Please use an image under 800KB, or paste an external Image URL (like from GitHub or Imgur) to ensure it saves correctly across all devices.");
    return;
  }
  
  const projectData = {
    id: id,
    title: document.getElementById('projTitle').value,
    desc: document.getElementById('projDesc').value,
    type: type,
    image: imageBase64 || '',
    isExternal: type === 'external'
  };
  
  if (type === 'external' || externalUrlVal) {
    projectData.externalUrl = externalUrlVal;
    projectData.html = `<iframe src="${externalUrlVal}" style="width:100%;height:100%;border:none;" allow="fullscreen"></iframe>`;
    projectData.css = '';
    projectData.js = '';
  } else {
    projectData.html = document.getElementById('projHtml').value;
    projectData.css = document.getElementById('projCss').value;
    projectData.js = document.getElementById('projJs').value;
  }
  
  await setDoc(doc(db, "projects", id), projectData);
  closeModal('projectModal');
}

// ===== UTILITIES & VIEWER =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function toggleCommentSection(feedbackId) {
  const section = document.getElementById(`comments-${feedbackId}`);
  if (section) section.classList.toggle('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function init3DTilt() {
  const cards = document.querySelectorAll('.project-card, .feedback-card, .whatido-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      card.style.transform = `perspective(1000px) rotateX(${((y - centerY) / centerY) * -4}deg) rotateY(${((x - centerX) / centerX) * 4}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

// ===== OPTIMIZED SCROLL LISTENER (Prevents Android Lag) =====
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const pct = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      const sp = document.getElementById('scrollProgress');
      if (sp) sp.style.width = pct + '%';
      
      const bt = document.getElementById('backToTop');
      if (bt) bt.classList.toggle('visible', window.pageYOffset > 400);
      
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  seedDatabase();
  initDataListeners();
  
  // Skills Tab
  const firstTab = document.querySelector('.tab-btn');
  if (firstTab) {
    firstTab.click();
  }
  window.switchSkillTab = function(category, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const el = document.getElementById('skillsContent');
    const d = skillsData[category];
    el.innerHTML = `<h3>${d.title}</h3><p>${d.desc}</p><div class="skill-tags">${d.tags.map(t => `<span>${t}</span>`).join('')}</div>`;
    el.style.animation = 'none';
    setTimeout(() => { el.style.animation = 'fadeIn 0.5s ease'; }, 10);
  };

  // Reveal on Scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Mobile Particle Reduction (Performance)
  const pc = document.getElementById('particles');
  if (pc) {
    const particleCount = isDesktop ? 30 : 10; // Fewer particles on mobile
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'particle' + (Math.random() > 0.5 ? ' silver' : '');
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (Math.random() * 10 + 10) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
      pc.appendChild(p);
    }
  }

  // Admin Mode
  window.toggleAdminMode = function() {
    if (!isAdmin) {
      document.getElementById('adminPasswordInput').value = '';
      document.getElementById('adminPasswordError').style.display = 'none';
      document.getElementById('adminPasswordModal').classList.add('active');
      setTimeout(() => document.getElementById('adminPasswordInput').focus(), 100);
    } else {
      isAdmin = false;
      document.body.classList.remove('admin-mode');
    }
  };

  window.checkAdminPassword = function() {
    const input = document.getElementById('adminPasswordInput').value;
    if (input === 'PsalmsJuco_23') {
      isAdmin = true;
      document.body.classList.add('admin-mode');
      closeModal('adminPasswordModal');
      renderProjects(); 
      renderFeedbacks();
    } else {
      document.getElementById('adminPasswordError').style.display = 'block';
      document.getElementById('adminPasswordInput').value = '';
    }
  };

  // File Input Preview
  const fileInput = document.getElementById('projImageFile');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('projImagePreview').src = ev.target.result;
          document.getElementById('projImageBase64').value = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Contact Form
  const cf = document.querySelector('.contact-form');
  if (cf) {
    cf.addEventListener('submit', async function(e) {
      e.preventDefault();
      const st = document.getElementById('formStatus');
      const sb = cf.querySelector('button[type="submit"]');
      sb.disabled = true; sb.innerHTML = '⏳ Sending...';
      st.style.display = 'block'; st.style.color = '#fbbf24'; st.textContent = 'Sending...';
      try {
        const r = await fetch(cf.action, { method: 'POST', body: new FormData(cf), headers: { 'Accept': 'application/json' } });
        if (r.ok) { st.style.color = '#4ade80'; st.textContent = '✅ Sent!'; cf.reset(); }
        else { st.style.color = '#ef4444'; st.textContent = '❌ Error.'; }
      } catch { st.style.color = '#ef4444'; st.textContent = '❌ Network error.'; }
      sb.disabled = false; sb.innerHTML = 'Send Message <span class="btn-arrow">→</span>';
      setTimeout(() => { st.style.display = 'none'; }, 5000);
    });
  }
});

// Close modals on outside click
window.onclick = function(e) {
  if (e.target === document.getElementById('projectModal')) closeModal('projectModal');
  if (e.target === document.getElementById('adminPasswordModal')) closeModal('adminPasswordModal');
};

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal('projectModal'); 
    closeModal('adminPasswordModal');
  }
});

// ===== SKILLS DATA =====
const skillsData = {
  frontend: { title: 'Frontend Development', desc: 'Building responsive, fast, and beautiful user interfaces.', tags: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Tailwind CSS', 'TypeScript'] },
  backend: { title: 'Backend Development', desc: 'Designing robust APIs and server-side solutions.', tags: ['Node.js', 'Python', 'C++', 'SQL', 'REST APIs', 'MongoDB'] },
  design: { title: 'UI/UX Design', desc: 'Crafting visual experiences that users love.', tags: ['Figma', 'Adobe Photoshop', 'Prototyping', 'Wireframing', 'Design Systems'] },
  mobile: { title: 'Mobile Development', desc: 'Cross-platform mobile development.', tags: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'] }
};

// ===== EXPOSE FUNCTIONS TO WINDOW FOR INLINE ONCLICK HANDLERS =====
window.closeModal = closeModal;
window.openProjectModal = openProjectModal;
window.toggleCodeFields = toggleCodeFields;
window.saveProject = saveProject;
window.deleteProject = deleteProject;
window.deleteFeedback = deleteFeedback;
window.toggleHeart = toggleHeart;
window.toggleCommentSection = toggleCommentSection;
window.addCommentToFeedback = addCommentToFeedback;
window.deleteComment = deleteComment;

// ===== MISSING VIEWER & ADMIN FUNCTIONS =====
// Note: currentViewerProject is already declared at the top of the file, so we don't use 'let' here.

window.openViewer = function(projectId) {
  const proj = projects.find(p => p.id === projectId);
  if (!proj) return;
  currentViewerProject = proj; // Reassigns the existing variable
  
  document.getElementById('viewerTitle').textContent = proj.title;
  document.getElementById('viewerDesc').textContent = proj.desc;
  document.getElementById('viewerIcon').textContent = proj.externalUrl ? '🔗' : '🌐';
  
  const viewer = document.getElementById('projectViewer');
  viewer.classList.add('active');
  
  const preview = document.getElementById('viewerPreview');
  if (proj.externalUrl) {
    preview.innerHTML = `<iframe src="${proj.externalUrl}" style="width:100%;height:100%;border:none;" allow="fullscreen"></iframe>`;
    document.getElementById('viewerNewTabBtn').style.display = 'inline-flex';
    document.getElementById('viewerRunBtn').style.display = 'none';
    document.getElementById('viewerCodeDisplay').textContent = `// External Project\n// URL: ${proj.externalUrl}`;
  } else {
    document.getElementById('viewerNewTabBtn').style.display = 'none';
    document.getElementById('viewerRunBtn').style.display = 'inline-flex';
    document.getElementById('viewerCodeDisplay').textContent = `<!-- HTML -->\n${proj.html || ''}\n\n/* CSS */\n${proj.css || ''}\n\n// JavaScript\n${proj.js || ''}`;
    window.runViewerCode();
  }
};

window.closeViewer = function() {
  document.getElementById('projectViewer').classList.remove('active');
  document.getElementById('viewerPreview').innerHTML = '';
  currentViewerProject = null;
};

window.runViewerCode = function() {
  if (!currentViewerProject || currentViewerProject.externalUrl) return;
  const preview = document.getElementById('viewerPreview');
  const html = currentViewerProject.html || '';
  const css = currentViewerProject.css ? `<style>${currentViewerProject.css}</style>` : '';
  const js = currentViewerProject.js ? `<script>${currentViewerProject.js}<\/script>` : '';
  preview.innerHTML = `<iframe srcdoc="${css}${html}${js}" style="width:100%;height:100%;border:none;" sandbox="allow-scripts allow-modals allow-forms allow-same-origin"></iframe>`;
};

window.toggleViewerFullscreen = function() {
  const container = document.querySelector('.viewer-container');
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => console.log(`Error: ${err.message}`));
  } else {
    document.exitFullscreen();
  }
};

window.openInNewTab = function() {
  if (currentViewerProject && currentViewerProject.externalUrl) {
    window.open(currentViewerProject.externalUrl, '_blank');
  }
};

window.addPublicComment = function(event) {
  event.preventDefault();
  alert("💡 This is a local demo form. To enable real public comments, please integrate Giscus or Disqus as mentioned in the UI.");
  event.target.reset();
};

window.clearAllComments = function() {
  if (!isAdmin) {
    alert("Admin mode required.");
    return;
  }
  if (confirm("Are you sure you want to clear ALL comments from all feedbacks? This cannot be undone.")) {
    feedbacks.forEach(fb => {
      if (fb.comments && fb.comments.length > 0) {
        updateDoc(doc(db, "feedbacks", fb.id), { comments: [] });
      }
    });
    alert("All comments cleared.");
  }
};

window.exportProjects = function() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "projects_export.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
