(function(){
  var d=document,r=d.documentElement,w=window;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v);}catch(e){return null;}}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function pad(n){return n<10?'0'+n:''+n;}

  // Theme toggle. The saved theme is applied early by the inline script in <head>.
  var t=d.getElementById('theme');
  function isDark(){var a=r.getAttribute('data-theme');return a?a==='dark':matchMedia('(prefers-color-scheme: dark)').matches;}
  function icon(){if(t)t.textContent=isDark()?'☀':'☾';}
  icon();
  if(t)t.addEventListener('click',function(){
    var n=isDark()?'light':'dark';r.setAttribute('data-theme',n);icon();
    try{localStorage.setItem('theme',n);}catch(e){}
  });

  // Smooth wheel scrolling. Touch keeps native scrolling.
  var lenis=null;
  if(!reduce&&w.Lenis){try{lenis=new w.Lenis({autoRaf:true,lerp:.1});}catch(e){lenis=null;}}
  function scrollToY(y){if(lenis)lenis.scrollTo(y,{duration:1.4});else w.scrollTo({top:y,behavior:reduce?'auto':'smooth'});}

  // Same-page anchors. Chapter cards in the filmstrip carry their own scroll position.
  d.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]');
    if(!a||e.defaultPrevented)return;
    var h=a.getAttribute('href');
    if(h==='#'){e.preventDefault();scrollToY(0);return;}
    var el=d.getElementById(h.slice(1));if(!el)return;
    e.preventDefault();
    scrollToY(el.dataset.y?+el.dataset.y:el.getBoundingClientRect().top+w.scrollY);
    try{history.replaceState(null,'',h);}catch(err){}
  });

  // Split headings into words so they can blur in one by one.
  function split(el){
    if(el.classList.contains('split'))return;
    el.classList.add('split');
    var i=0;
    (function walk(n){
      Array.prototype.slice.call(n.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var f=d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(p){
            if(!p)return;
            if(/^\s+$/.test(p)){f.appendChild(d.createTextNode(p));return;}
            var s=d.createElement('span');s.className='w';s.style.setProperty('--i',i++);s.textContent=p;f.appendChild(s);
          });
          n.replaceChild(f,c);
        }else if(c.nodeType===1)walk(c);
      });
    })(el);
  }
  if(!reduce)d.querySelectorAll('.hero h1,.sec-head h2,.life-hero h1,.contact h2,.ch-card h3,.np-h').forEach(split);
  d.querySelectorAll('.mosaic,.pillars').forEach(function(g){Array.prototype.forEach.call(g.children,function(c,i){c.style.setProperty('--i',i);});});

  // Number each project card: 01 / 07.
  var projs=d.querySelectorAll('.projects .project');
  projs.forEach(function(p,i){var im=p.querySelector('.p-img');if(im)im.setAttribute('data-n',pad(i+1)+' / '+pad(projs.length));});

  // Count result numbers up from zero when they come into view.
  function countUp(el){
    var items=[];
    (function walk(n){n.childNodes.forEach(function(c){
      if(c.nodeType===1){walk(c);return;}
      if(c.nodeType!==3)return;
      var src=c.textContent,re=/\d[\d,]*(?:\.\d+)?/g,m,parts=[],last=0;
      while((m=re.exec(src))){
        parts.push(src.slice(last,m.index));
        parts.push({v:parseFloat(m[0].replace(/,/g,'')),dec:(m[0].split('.')[1]||'').length,comma:m[0].indexOf(',')>-1});
        last=m.index+m[0].length;
      }
      if(parts.length){parts.push(src.slice(last));items.push({node:c,parts:parts});}
    });})(el);
    if(!items.length)return;
    var cs=getComputedStyle(el),inline=cs.display==='inline';
    if(inline){el.style.display='inline-block';el.style.minWidth=el.getBoundingClientRect().width+'px';el.style.textIndent='0';}
    var t0=null,dur=1500;
    function fmt(p,k){var v=p.v*k;return p.comma?Math.round(v).toLocaleString('en-US'):v.toFixed(p.dec);}
    function step(ts){
      if(t0===null)t0=ts;
      var x=clamp((ts-t0)/dur,0,1),k=x===1?1:1-Math.pow(2,-10*x);
      items.forEach(function(it){it.node.textContent=it.parts.map(function(p){return typeof p==='string'?p:fmt(p,k);}).join('');});
      if(x<1)requestAnimationFrame(step);else if(inline){el.style.display='';el.style.minWidth='';el.style.textIndent='';}
    }
    requestAnimationFrame(step);
  }

  // Filmstrip: scrolling down slides the photos sideways.
  var film=d.getElementById('film'),F=null;
  if(film&&!reduce){
    film.classList.add('on');
    var track=film.querySelector('.film-track'),ch='';
    F={pin:film.querySelector('.film-pin'),track:track,figs:[],cards:[].slice.call(track.querySelectorAll('.ch-card')),
       n:film.querySelector('.hud-n b'),cap:film.querySelector('.hud-cap'),chl:film.querySelector('.hud-ch'),bar:film.querySelector('.hud-bar'),act:-1};
    Array.prototype.forEach.call(track.children,function(c){
      if(c.classList.contains('ch-card')){ch=c.getAttribute('data-ch');return;}
      if(c.tagName==='FIGURE')F.figs.push({el:c,img:c.querySelector('img'),ch:ch,cap:c.querySelector('figcaption').textContent});
    });
    F.n.nextSibling.textContent=' / '+pad(F.figs.length);
  }else if(film){
    film.querySelectorAll('figure').forEach(function(f){f.classList.add('reveal');});
  }
  function layoutFilm(){
    if(!F)return;
    var vw=w.innerWidth,padL=parseFloat(getComputedStyle(F.track).paddingLeft)||0;
    F.dist=Math.max(0,F.track.scrollWidth-vw);
    F.k=.6;
    // Fit each photo inside the strip's height and a max width, keeping its shape.
    var H=F.track.clientHeight,W=vw*(vw<700?.84:.7);
    F.figs.forEach(function(f){var r=f.img.getAttribute('width')/f.img.getAttribute('height')||1.5,fh=H,fw=fh*r;if(fw>W){fw=W;fh=fw/r;}f.el.style.width=Math.round(fw)+'px';f.el.style.height=Math.round(fh)+'px';});
    film.style.height=(F.pin.offsetHeight+F.dist*F.k)+'px';
    F.top=film.getBoundingClientRect().top+w.scrollY;
    F.figs.forEach(function(f){f.l=f.el.offsetLeft;f.w=f.el.offsetWidth;});
    F.cards.forEach(function(c){c.dataset.y=Math.round(F.top+clamp(c.offsetLeft-padL,0,F.dist)*F.k);});
  }
  function updateFilm(y,vw){
    var p=F.dist?clamp((y-F.top)/(F.dist*F.k),0,1):0,x=p*F.dist,best=0,bd=1e9;
    F.track.style.transform='translate3d('+(-x).toFixed(1)+'px,0,0)';
    F.bar.style.setProperty('--fp',p.toFixed(4));
    F.figs.forEach(function(f,i){
      var cx=f.l-x+f.w/2,off=(cx-vw/2)/vw;
      if(off>-1.2&&off<1.2)f.img.style.translate=(off*-7).toFixed(2)+'% 0';
      var dd=Math.abs(cx-vw*(.3+.5*p));if(dd<bd){bd=dd;best=i;}
    });
    if(best!==F.act){
      if(F.act>=0)F.figs[F.act].el.classList.remove('act');
      F.act=best;var f=F.figs[best];f.el.classList.add('act');
      F.n.textContent=pad(best+1);F.chl.textContent=f.ch;
      F.cap.textContent=f.cap;F.cap.classList.remove('swap');void F.cap.offsetWidth;F.cap.classList.add('swap');
    }
  }
  if(F){
    // Load the strip's photos a little before it arrives, since they sit off-screen to the right.
    var lo=new IntersectionObserver(function(es){if(es[0].isIntersecting){F.figs.forEach(function(f){f.img.loading='eager';});lo.disconnect();}},{rootMargin:'150% 0px'});
    lo.observe(film);
  }

  // Scroll-linked effects: progress line, parallax, hero, filmstrip.
  var nav=d.querySelector('nav'),hero=d.querySelector('.life-hero'),vh=w.innerHeight,ticking=false;
  var par=reduce?[]:[].slice.call(d.querySelectorAll('.mosaic img'));
  function frame(){
    ticking=false;
    var y=w.scrollY,vw=w.innerWidth,max=r.scrollHeight-vh;
    nav.classList.toggle('scrolled',y>10);
    nav.style.setProperty('--sp',max>0?(y/max).toFixed(4):0);
    if(film){var fb=film.getBoundingClientRect();nav.classList.toggle('on-dark',fb.top<=nav.offsetHeight&&fb.bottom>nav.offsetHeight);}
    if(reduce)return;
    par.forEach(function(im){
      var b=im.parentNode.getBoundingClientRect();
      if(b.bottom<0||b.top>vh)return;
      var p=(b.top+b.height/2-vh/2)/(vh/2+b.height/2);
      im.style.translate='0 '+(-p*b.height*.045).toFixed(1)+'px';
    });
    if(hero)hero.style.setProperty('--hp',clamp(y/hero.offsetHeight,0,1).toFixed(3));
    if(F)updateFilm(y,vw);
  }
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(frame);}}
  w.addEventListener('scroll',onScroll,{passive:true});
  var lastW=w.innerWidth,rt;
  function relayout(){vh=w.innerHeight;layoutFilm();onScroll();}
  w.addEventListener('resize',function(){
    // Mobile URL bars resize the viewport while scrolling; only re-measure on real changes.
    if(w.innerWidth===lastW&&Math.abs(w.innerHeight-vh)<120)return;
    lastW=w.innerWidth;clearTimeout(rt);rt=setTimeout(relayout,150);
  });
  w.addEventListener('load',relayout);
  layoutFilm();frame();

  // Reveal on scroll. Held until the intro has lifted.
  var started=false;
  function start(){
    if(started)return;started=true;
    r.classList.remove('cover');
    d.querySelectorAll('[data-intro]').forEach(function(el){el.classList.add('in');});
    var els=d.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in w)){els.forEach(function(el){el.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){io.observe(el);});
    if(reduce)return;
    var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){countUp(e.target);co.unobserve(e.target);}});},{threshold:.6});
    d.querySelectorAll('.stat b,.project li b,.p-type .big').forEach(function(el){co.observe(el);});
  }

  // Intro: a short preloader on the first visit, a curtain after moving between pages.
  function curtain(cls){var c=d.createElement('div');c.className='curtain '+(cls||'');c.setAttribute('aria-hidden','true');c.innerHTML='<span class="logo">SA<span>·</span></span>';d.body.appendChild(c);return c;}
  function lift(el,delay){
    setTimeout(function(){el.classList.add('out');start();},delay);
    el.addEventListener('transitionend',function(e){if(e.target===el)el.remove();});
    setTimeout(function(){if(el.parentNode)el.remove();},delay+1600);
  }
  var first=!store('seen'),arrived=store('pt');
  store('seen','1');store('pt',null);
  if(reduce)start();
  else if(arrived){var c=curtain();r.classList.remove('cover');requestAnimationFrame(function(){lift(c,60);});}
  else if(first){
    var L=d.createElement('div');L.className='loader';L.setAttribute('aria-hidden','true');
    L.innerHTML='<div class="ld-in"><div class="ld-logo">SA<span>·</span></div><p class="ld-tag"></p><div class="ld-row"><span class="ld-bar"><i></i></span><span class="ld-num">000</span></div></div>';
    var tag=L.querySelector('.ld-tag');tag.textContent=d.body.getAttribute('data-tag')||'Subham Agrawal';split(tag);
    d.body.appendChild(L);r.classList.remove('cover');
    if(lenis)lenis.stop();
    var num=L.querySelector('.ld-num'),bar=L.querySelector('.ld-bar'),t1=null;
    requestAnimationFrame(function(){L.classList.add('in');});
    (function tick(ts){
      if(t1===null)t1=ts;
      var x=clamp((ts-t1)/1300,0,1),k=x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
      bar.style.setProperty('--lp',k.toFixed(3));num.textContent=('00'+Math.round(k*100)).slice(-3);
      if(x<1)requestAnimationFrame(tick);
    })(performance.now());
    lift(L,1750);
    setTimeout(function(){if(lenis)lenis.start();},1750);
    L.addEventListener('click',function(){L.classList.add('out');start();if(lenis)lenis.start();});
  }else start();

  // Page transitions: a dark curtain rises before moving to another page.
  d.addEventListener('click',function(e){
    if(reduce||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||a.target||a.hasAttribute('download'))return;
    var u=new URL(a.href,location.href);
    if(u.origin!==location.origin||u.pathname===location.pathname||!/(\.html|\/)$/.test(u.pathname))return;
    e.preventDefault();
    var c=curtain('enter');void c.offsetWidth;c.classList.remove('enter');
    store('pt','1');
    setTimeout(function(){location.href=u.href;},650);
  });
  w.addEventListener('pageshow',function(e){if(e.persisted)d.querySelectorAll('.curtain').forEach(function(c){c.remove();});});

  var copy=d.getElementById('copy');
  if(copy)copy.addEventListener('click',function(){
    var done=function(){copy.textContent='Copied ✓';setTimeout(function(){copy.textContent='Copy email';},1800);};
    if(navigator.clipboard)navigator.clipboard.writeText('b23ci1038@iitj.ac.in').then(done,function(){});
  });

  // Lightbox for the photos, with arrows, keys and swipe.
  var lb=d.getElementById('lightbox');
  if(lb){
    var figs=[].slice.call(d.querySelectorAll('.gallery figure')),cur=0,li=lb.querySelector('img'),lp=lb.querySelector('p'),x0=null;
    function show(i){
      cur=(i+figs.length)%figs.length;
      var im=figs[cur].querySelector('img');
      li.src=im.currentSrc||im.src;li.alt=im.alt;
      lp.textContent=figs[cur].querySelector('figcaption').textContent+'  ·  '+(cur+1)+' / '+figs.length;
      li.classList.remove('pop');void li.offsetWidth;li.classList.add('pop');
    }
    function open(i){show(i);lb.classList.add('open');if(lenis)lenis.stop();}
    function close(){lb.classList.remove('open');if(lenis)lenis.start();}
    figs.forEach(function(f,i){
      f.tabIndex=0;f.setAttribute('role','button');
      f.addEventListener('click',function(){open(i);});
      f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i);}});
    });
    lb.querySelector('.lb-prev').addEventListener('click',function(e){e.stopPropagation();show(cur-1);});
    lb.querySelector('.lb-next').addEventListener('click',function(e){e.stopPropagation();show(cur+1);});
    lb.addEventListener('click',function(e){if(e.target!==li)close();});
    d.addEventListener('keydown',function(e){
      if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(cur-1);else if(e.key==='ArrowRight')show(cur+1);
    });
    lb.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
    lb.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)show(cur+(dx<0?1:-1));});
  }
})();
