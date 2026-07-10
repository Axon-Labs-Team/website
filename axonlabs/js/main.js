/* ============================================================
   AXON LABS — main.js
   Nav, fondo de partículas/circuitos, scroll reveal, contadores, FAQ
   ============================================================ */
(function(){
  "use strict";

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll state ---------- */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');

  function onScroll(){
    if(!nav) return;
    if(window.scrollY > 12){ nav.classList.add('scrolled'); }
    else{ nav.classList.remove('scrolled'); }
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  if(toggle && links){
    toggle.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
      });
    });
  }

  /* Mark current page link as active */
  var here = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[data-page]').forEach(function(a){
    if(a.getAttribute('data-page') === here){ a.classList.add('active'); }
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.12, rootMargin:'0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var val = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
      if(progress < 1) requestAnimationFrame(step);
    }
    if(reduceMotion){ el.textContent = target + suffix; return; }
    requestAnimationFrame(step);
  }
  if(counters.length){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold:.6 });
    counters.forEach(function(el){ cio.observe(el); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var q = item.querySelector('.faq-q');
    if(!q) return;
    q.addEventListener('click', function(){
      var wasOpen = item.classList.contains('open');
      item.closest('.faq-list').querySelectorAll('.faq-item.open').forEach(function(i){
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded','false');
      });
      if(!wasOpen){
        item.classList.add('open');
        q.setAttribute('aria-expanded','true');
      }
    });
  });

  /* ============================================================
     Fondo tecnológico: partículas + líneas de circuito
     ============================================================ */
  var canvas = document.getElementById('fx-canvas');
  if(canvas && !reduceMotion){
    var ctx = canvas.getContext('2d');
    var W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var NUM = window.innerWidth < 720 ? 34 : 70;

    function resize(){
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    function rand(a,b){ return a + Math.random()*(b-a); }

    function Particle(){
      this.x = rand(0, W);
      this.y = rand(0, H);
      this.vx = rand(-.15,.15) * dpr;
      this.vy = rand(-.15,.15) * dpr;
      this.r = rand(1, 2.4) * dpr;
      this.hue = Math.random() > .5 ? '111,61,255' : '0,229,255';
    }
    for(var i=0;i<NUM;i++){ particles.push(new Particle()); }

    var maxDist = 150 * dpr;

    function tick(){
      ctx.clearRect(0,0,W,H);
      for(var a=0;a<particles.length;a++){
        var p = particles[a];
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > W) p.vx *= -1;
        if(p.y < 0 || p.y > H) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(' + p.hue + ',.55)';
        ctx.fill();

        for(var b=a+1;b<particles.length;b++){
          var q = particles[b];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx*dx+dy*dy);
          if(dist < maxDist){
            var op = (1 - dist/maxDist) * .18;
            ctx.beginPath();
            ctx.moveTo(p.x,p.y);
            ctx.lineTo(q.x,q.y);
            ctx.strokeStyle = 'rgba(120,160,255,' + op + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

})();
