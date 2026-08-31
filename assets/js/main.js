/* =========================================================
   SOFT PRIME — main.js
   Handles: language toggle, particle bg, custom cursor,
   nav behavior, scroll reveal, counters, tilt, lightbox,
   page-fade transitions, timeline progress.
   ========================================================= */

(function(){
  "use strict";

  /* ---------------- Language ---------------- */
  const LANG_KEY = 'sp-lang';
  function getLang(){ return localStorage.getItem(LANG_KEY) || 'en'; }
  function setLang(lang){
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }
  function applyLang(lang){
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.querySelectorAll('[data-en]').forEach(el=>{
      const val = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
      if(val !== null){
        el.classList.add('lang-fade');
        requestAnimationFrame(()=>{
          if(el.hasAttribute('data-html')){ el.innerHTML = val; } else { el.textContent = val; }
          requestAnimationFrame(()=> el.classList.remove('lang-fade'));
        });
      }
    });
    document.querySelectorAll('.lang-switch button').forEach(b=>{
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }

  function initLangSwitch(){
    document.querySelectorAll('.lang-switch button').forEach(btn=>{
      btn.addEventListener('click', ()=> setLang(btn.dataset.lang));
    });
    applyLang(getLang());
  }

  /* ---------------- Nav scroll state ---------------- */
  function initNav(){
    const nav = document.querySelector('.navbar');
    if(!nav) return;
    const onScroll = ()=>{
      nav.classList.toggle('scrolled', window.scrollY > 30);
      const beam = document.querySelector('.scroll-beam');
      if(beam){
        const h = document.documentElement;
        const pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight||document.body.scrollHeight) - h.clientHeight) * 100;
        beam.style.width = pct + '%';
      }
      const toTop = document.querySelector('.to-top');
      if(toTop) toTop.classList.toggle('show', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();

    const burger = document.querySelector('.nav-burger');
    const menu = document.querySelector('.mobile-menu');
    if(burger && menu){
      burger.addEventListener('click', ()=>{
        menu.classList.toggle('open');
        burger.classList.toggle('open');
      });
      menu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>{
        menu.classList.remove('open'); burger.classList.remove('open');
      }));
    }

    const toTop = document.querySelector('.to-top');
    if(toTop){
      toTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
    }
  }

  /* ---------------- Custom cursor ---------------- */
  function initCursor(){
    if(window.matchMedia('(hover:none)').matches) return;
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let rx=0, ry=0, dx=0, dy=0;
    window.addEventListener('mousemove', e=>{
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
    });
    (function loop(){
      rx += (dx-rx)*0.15; ry += (dy-ry)*0.15;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,.panel,.proj-card,input,textarea,.filter-btn').forEach(el=>{
      el.addEventListener('mouseenter', ()=> ring.classList.add('active'));
      el.addEventListener('mouseleave', ()=> ring.classList.remove('active'));
    });
  }

  /* ---------------- Particle network background ---------------- */
  function initParticles(){
    const canvas = document.getElementById('bg-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w,h,points;
    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(70, Math.floor((w*h)/22000));
      points = Array.from({length:count}, ()=>({
        x:Math.random()*w, y:Math.random()*h,
        vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3
      }));
    }
    function tick(){
      ctx.clearRect(0,0,w,h);
      points.forEach(p=>{
        p.x += p.vx; p.y += p.vy;
        if(p.x<0||p.x>w) p.vx*=-1;
        if(p.y<0||p.y>h) p.vy*=-1;
      });
      for(let i=0;i<points.length;i++){
        for(let j=i+1;j<points.length;j++){
          const a=points[i], b=points[j];
          const d = Math.hypot(a.x-b.x, a.y-b.y);
          if(d<140){
            ctx.strokeStyle = `rgba(94,200,255,${(1-d/140)*0.15})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(148,168,220,.5)';
        ctx.beginPath(); ctx.arc(points[i].x, points[i].y, 1.4, 0, Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    window.addEventListener('resize', resize);
    resize(); tick();
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveal(){
    const els = document.querySelectorAll('.reveal, .reveal-scale');
    if(!els.length) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.15});
    els.forEach(el=> io.observe(el));
  }

  /* ---------------- Counters ---------------- */
  function initCounters(){
    const els = document.querySelectorAll('[data-count]');
    if(!els.length) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1400;
        const start = performance.now();
        function step(now){
          const p = Math.min(1, (now-start)/dur);
          const eased = 1 - Math.pow(1-p, 3);
          const val = target < 10 && target % 1 !== 0 ? (target*eased).toFixed(1) : Math.floor(target*eased);
          el.textContent = val + suffix;
          if(p<1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, {threshold:.5});
    els.forEach(el=> io.observe(el));
  }

  /* ---------------- Tilt on panels ---------------- */
  function initTilt(){
    if(window.matchMedia('(hover:none)').matches) return;
    document.querySelectorAll('.tilt').forEach(card=>{
      card.addEventListener('mousemove', e=>{
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width - .5;
        const py = (e.clientY - r.top)/r.height - .5;
        card.style.transform = `perspective(700px) rotateX(${py*-6}deg) rotateY(${px*6}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', ()=>{
        card.style.transform = '';
      });
    });
  }

  /* ---------------- Timeline progress ---------------- */
  function initTimeline(){
    const wrap = document.querySelector('.timeline');
    if(!wrap) return;
    const progress = wrap.querySelector('.timeline-progress');
    const items = wrap.querySelectorAll('.tl-item');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{ if(en.isIntersecting) en.target.classList.add('in'); });
    }, {threshold:.4});
    items.forEach(i=> io.observe(i));
    window.addEventListener('scroll', ()=>{
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height;
      const visible = Math.min(total, Math.max(0, vh*0.6 - r.top));
      progress.style.height = Math.min(100, (visible/total)*100) + '%';
    }, {passive:true});
  }

  /* ---------------- Filter (projects) ---------------- */
  function initFilters(){
    const row = document.querySelector('.filter-row');
    if(!row) return;
    const cards = document.querySelectorAll('[data-cat]');
    row.querySelectorAll('.filter-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        row.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        cards.forEach(card=>{
          const show = cat === 'all' || card.dataset.cat === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------------- Gallery Lightbox (project pages) ---------------- */
  function initLightbox(){
    const lb = document.querySelector('.lightbox');
    const grid = document.querySelector('.gallery-grid');
    if(!lb || !grid) return;
    const stageImg = lb.querySelector('.lightbox-stage img');
    const thumbsWrap = lb.querySelector('.lightbox-thumbs');
    const counter = lb.querySelector('.lightbox-counter');
    let images = [];
    try{ images = JSON.parse(grid.dataset.images); }catch(e){ images = []; }
    let currentIndex = 0;

    function render(){
      stageImg.src = images[currentIndex];
      if(counter) counter.textContent = (currentIndex+1) + ' / ' + images.length;
      thumbsWrap.querySelectorAll('img').forEach((t,i)=> t.classList.toggle('active', i===currentIndex));
    }
    function open(i){
      currentIndex = i;
      thumbsWrap.innerHTML = images.map((src,idx)=>`<img src="${src}" data-i="${idx}">`).join('');
      thumbsWrap.querySelectorAll('img').forEach(t=> t.addEventListener('click', ()=>{ currentIndex = +t.dataset.i; render(); }));
      render();
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close(){
      lb.classList.remove('open');
      document.body.style.overflow = '';
    }
    grid.querySelectorAll('.gallery-item').forEach(item=>{
      item.addEventListener('click', ()=> open(+item.dataset.index));
    });
    lb.querySelector('.lightbox-close').addEventListener('click', close);
    lb.addEventListener('click', e=>{ if(e.target === lb) close(); });
    lb.querySelector('.lightbox-nav.prev').addEventListener('click', ()=>{ currentIndex = (currentIndex-1+images.length)%images.length; render(); });
    lb.querySelector('.lightbox-nav.next').addEventListener('click', ()=>{ currentIndex = (currentIndex+1)%images.length; render(); });
    window.addEventListener('keydown', e=>{
      if(!lb.classList.contains('open')) return;
      if(e.key==='Escape') close();
      if(e.key==='ArrowRight') { currentIndex=(currentIndex+1)%images.length; render(); }
      if(e.key==='ArrowLeft') { currentIndex=(currentIndex-1+images.length)%images.length; render(); }
    });
  }

  /* ---------------- Page fade transitions ---------------- */
  function initPageTransitions(){
    const fade = document.createElement('div');
    fade.className = 'page-fade';
    document.body.appendChild(fade);
    document.querySelectorAll('a[href]').forEach(a=>{
      const href = a.getAttribute('href');
      if(!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;
      a.addEventListener('click', e=>{
        e.preventDefault();
        fade.classList.add('active');
        setTimeout(()=>{ window.location.href = href; }, 420);
      });
    });
  }

  /* ---------------- WhatsApp contact form helper ---------------- */
  function initContactForm(){
    const form = document.querySelector('#contact-form');
    if(!form) return;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name = form.querySelector('[name="name"]').value.trim();
      const service = form.querySelector('[name="service"]').value.trim();
      const message = form.querySelector('[name="message"]').value.trim();
      const lang = getLang();
      const text = lang === 'ar'
        ? `مرحبًا Soft Prime، أنا ${name}.%0Aمهتم بـ: ${service}%0A${message}`
        : `Hi Soft Prime, I'm ${name}.%0AInterested in: ${service}%0A${message}`;
      window.open(`https://wa.me/201145466800?text=${text}`, '_blank');
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    initLangSwitch();
    initNav();
    initCursor();
    initParticles();
    initReveal();
    initCounters();
    initTilt();
    initTimeline();
    initFilters();
    initLightbox();
    initPageTransitions();
    initContactForm();
  });
})();
