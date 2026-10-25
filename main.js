(function(){
  var d=document,r=d.documentElement,w=window;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=!reduce&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  function store(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v);}catch(e){return null;}}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function pad(n){return n<10?'0'+n:''+n;}
  function all(s,root){return [].slice.call((root||d).querySelectorAll(s));}

  // Theme toggle. Dark is the default; the saved theme is applied early by the inline script in <head>.
  var t=d.getElementById('theme');
  function isDark(){return r.getAttribute('data-theme')!=='light';}
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

  // Split headings into words so they can flip up one by one.
  function split(el){
    if(el.classList.contains('split'))return;
    el.classList.add('split');
    var i=0;
    (function walk(n){
      [].slice.call(n.childNodes).forEach(function(c){
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
  if(!reduce)all('.hero h1,.sec-head h2,.life-hero h1,.contact h2,.ch-card h3,.np-h').forEach(split);
  all('.pillars,.stats,.recog,.hobbies').forEach(function(g){[].forEach.call(g.children,function(c,i){c.style.setProperty('--i',i);});});

  // Number each project card: 01 / 07.
  var projs=all('.projects .project');
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

  // Springs: small values that ease toward a target each frame (tilt, magnetic buttons, hero depth).
  var springs=[];
  function spring(apply){return {x:0,y:0,g:0,tx:0,ty:0,tg:0,on:false,apply:apply};}
  function kick(s){if(!s.on){s.on=true;springs.push(s);}}
  function runSprings(){
    for(var i=springs.length-1;i>=0;i--){
      var s=springs[i];
      s.x+=(s.tx-s.x)*.12;s.y+=(s.ty-s.y)*.12;s.g+=(s.tg-s.g)*.12;
      if(Math.abs(s.tx-s.x)<.002&&Math.abs(s.ty-s.y)<.002&&Math.abs(s.tg-s.g)<.002){s.x=s.tx;s.y=s.ty;s.g=s.tg;s.on=false;springs.splice(i,1);}
      s.apply(s);
    }
  }

  // Cards lean toward the pointer in 3D, with a soft glare.
  function tilt(el,max,glare){
    el.classList.add('tilt');if(glare)el.classList.add('glare');
    var s=spring(function(s){el.style.setProperty('--rx',(s.y*-max).toFixed(2)+'deg');el.style.setProperty('--ry',(s.x*max).toFixed(2)+'deg');if(glare)el.style.setProperty('--go',s.g.toFixed(3));});
    el.addEventListener('pointermove',function(e){
      if(e.pointerType!=='mouse')return;
      var b=el.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
      s.tx=x-.5;s.ty=y-.5;s.tg=1;kick(s);
      if(glare){el.style.setProperty('--gx',(x*100).toFixed(1)+'%');el.style.setProperty('--gy',(y*100).toFixed(1)+'%');}
    });
    el.addEventListener('pointerleave',function(){s.tx=0;s.ty=0;s.tg=0;kick(s);});
  }
  function magnet(el,k){
    var s=spring(function(s){el.style.translate=s.x.toFixed(1)+'px '+s.y.toFixed(1)+'px';});
    el.addEventListener('pointermove',function(e){
      if(e.pointerType!=='mouse')return;
      var b=el.getBoundingClientRect();s.tx=(e.clientX-b.left-b.width/2)*k;s.ty=(e.clientY-b.top-b.height/2)*k;kick(s);
    });
    el.addEventListener('pointerleave',function(){s.tx=0;s.ty=0;kick(s);});
  }
  if(fine){
    all('.p-img').forEach(function(el){tilt(el,7,true);});
    all('.p3d,.rc,.hobby,.stat').forEach(function(el){tilt(el,11,true);});
    all('.pillar').forEach(function(el){tilt(el,6,true);});
    all('.next-panel').forEach(function(el){tilt(el,5,true);});
    all('.contact h2').forEach(function(el){tilt(el,16,false);});
    all('.btn,#theme,.pill').forEach(function(el){magnet(el,.28);});
  }

  // A ring that trails the pointer and grows over things you can click.
  var cur=null,cx=-100,cy=-100,px=-100,py=-100;
  if(fine){
    cur=d.createElement('div');cur.className='cursor';cur.setAttribute('aria-hidden','true');cur.innerHTML='<span></span>';d.body.appendChild(cur);
    var lab=cur.firstChild;
    all('.gallery figure').forEach(function(f){f.setAttribute('data-cursor','View');});
    all('.pillar').forEach(function(f){f.setAttribute('data-cursor','Open');});
    var hoverAt=function(el){
      var l=el&&el.closest?el.closest('[data-cursor]'):null;
      cur.classList.toggle('label',!!l);if(l)lab.textContent=l.getAttribute('data-cursor');
      cur.classList.toggle('hover',!l&&!!(el&&el.closest&&el.closest('a,button,[role="button"]')));
    };
    w.addEventListener('pointermove',function(e){
      if(e.pointerType!=='mouse')return;
      px=e.clientX;py=e.clientY;
      if(cx<-50){cx=px;cy=py;cur.style.transform='translate3d('+cx+'px,'+cy+'px,0)';}
      cur.classList.add('on');
      hoverAt(e.target);
    },{passive:true});
    d.addEventListener('pointerleave',function(){cur.classList.remove('on');});
  }

  // Hero depth: the hero leans with the pointer.
  var hero=d.querySelector('[data-intro]'),hs=null;
  if(hero&&fine){
    hs=spring(function(s){hero.style.setProperty('--mx',s.x.toFixed(3));hero.style.setProperty('--my',s.y.toFixed(3));});
    w.addEventListener('pointermove',function(e){if(w.scrollY>hero.offsetHeight)return;hs.tx=e.clientX/w.innerWidth-.5;hs.ty=e.clientY/w.innerHeight-.5;kick(hs);},{passive:true});
  }

  // Projects stack like a deck on screens tall enough to hold a whole card.
  var stackEl=d.querySelector('.projects'),S=null;
  function layoutStack(){
    if(!stackEl||reduce)return;
    stackEl.classList.remove('stack');S=null;
    projs.forEach(function(c){c.style.top='';c.style.transform='';c.style.removeProperty('--dim');});
    var vh=w.innerHeight,top0=(nav?nav.offsetHeight:0)+18,gap=12,maxH=0;
    projs.forEach(function(c){maxH=Math.max(maxH,c.offsetHeight);});
    if(w.innerWidth<900||maxH+top0+gap*(projs.length-1)+18>vh)return;
    var base=stackEl.getBoundingClientRect().top+w.scrollY;
    S={nat:[],top:[]};
    projs.forEach(function(c,i){S.nat[i]=base+c.offsetTop;S.top[i]=top0+i*gap;c.style.top=S.top[i]+'px';});
    stackEl.classList.add('stack');
  }
  function updateStack(y,vh){
    var n=projs.length,q=[],i,depth=0;
    for(i=0;i<n;i++)q[i]=clamp((S.nat[i]-y-S.top[i])/(vh-S.top[i]),0,1);
    for(i=n-1;i>=0;i--){
      var dep=Math.min(depth,4),rx=q[i]*6-dep*2.2,sc=1-dep*.04;
      projs[i].style.transform='perspective(1400px) rotateX('+rx.toFixed(2)+'deg) scale('+sc.toFixed(4)+')';
      projs[i].style.setProperty('--dim',(Math.min(depth,3)*.17).toFixed(3));
      depth+=1-q[i];
    }
  }

  // Journey: the line fills and each stop lights up as you scroll past it.
  var tline=d.querySelector('.timeline'),tls=tline?all('.tl',tline):[];
  function updateTimeline(vh){
    var b=tline.getBoundingClientRect();
    if(b.bottom<-200||b.top>vh+200)return;
    var mark=vh*.62;
    tline.style.setProperty('--tp',clamp((mark-b.top)/b.height,0,1).toFixed(4));
    tls.forEach(function(el){el.classList.toggle('lit',b.top+el.offsetTop+38<mark);});
  }

  // Ribbons lean with scroll speed.
  var rib=d.querySelector('.ribbons'),sk=0;

  // Photo ring: spins slowly, faster with scroll, and can be dragged.
  var ringEl=d.getElementById('ring'),R=null;
  if(ringEl&&!reduce){
    ringEl.classList.add('live');
    R={inn:ringEl.querySelector('.ring-in'),cards:all('.ring-in a',ringEl),a:0,v:0,vis:false,drag:null};
    new IntersectionObserver(function(es){R.vis=es[0].isIntersecting;}).observe(ringEl);
    ringEl.addEventListener('pointerdown',function(e){
      if(e.button!==0)return;
      R.drag={x:e.clientX,a:R.a,moved:0,lx:e.clientX,lt:performance.now(),v:0};
      ringEl.classList.add('drag');
    });
    w.addEventListener('pointermove',function(e){
      var g=R.drag;if(!g)return;
      var dx=e.clientX-g.x,now=performance.now();
      g.moved=Math.max(g.moved,Math.abs(dx));
      R.a=g.a+dx*.28;
      g.v=(e.clientX-g.lx)*.28/Math.max(now-g.lt,1)*16.7;g.lx=e.clientX;g.lt=now;
    },{passive:true});
    function endDrag(){if(!R.drag)return;R.v=clamp(R.drag.v,-12,12);R.moved=R.drag.moved;R.drag=null;ringEl.classList.remove('drag');}
    w.addEventListener('pointerup',endDrag);w.addEventListener('pointercancel',endDrag);
    ringEl.addEventListener('click',function(e){if(R.moved>6){e.preventDefault();e.stopPropagation();}R.moved=0;},true);
  }
  function updateRing(dy){
    if(!R.drag){R.a+=R.v-.07-dy*.1;R.v*=.95;}
    R.inn.style.transform='rotateX(-7deg) rotateY('+R.a.toFixed(2)+'deg)';
    R.cards.forEach(function(c,i){var th=(i*30+R.a)*Math.PI/180;c.style.setProperty('--d',((1-Math.cos(th))*.36).toFixed(3));});
  }

  // Filmstrip: scrolling down rolls the photos sideways round a drum.
  var film=d.getElementById('film'),F=null;
  if(film&&!reduce){
    film.classList.add('on');
    var track=film.querySelector('.film-track'),ch='';
    F={pin:film.querySelector('.film-pin'),track:track,figs:[],cards:all('.ch-card',track),
       n:film.querySelector('.hud-n b'),cap:film.querySelector('.hud-cap'),chl:film.querySelector('.hud-ch'),bar:film.querySelector('.hud-bar'),act:-1};
    [].forEach.call(track.children,function(c){
      if(c.classList.contains('ch-card')){ch=c.getAttribute('data-ch');return;}
      if(c.tagName==='FIGURE')F.figs.push({el:c,img:c.querySelector('img'),ch:ch,cap:c.querySelector('figcaption').textContent});
    });
    F.items=F.figs.map(function(f){return f;}).concat(F.cards.map(function(c){return {el:c,card:true};}));
    F.n.nextSibling.textContent=' / '+pad(F.figs.length);
  }else if(film){
    all('figure',film).forEach(function(f){f.classList.add('reveal');});
  }
  function layoutFilm(){
    if(!F)return;
    var vw=w.innerWidth,padL=parseFloat(getComputedStyle(F.track).paddingLeft)||0;
    // Fit each photo inside the strip's height and a max width, keeping its shape.
    var H=F.track.clientHeight,W=vw*(vw<700?.84:.7);
    F.figs.forEach(function(f){var q=f.img.getAttribute('width')/f.img.getAttribute('height')||1.5,fh=H,fw=fh*q;if(fw>W){fw=W;fh=fw/q;}f.el.style.width=Math.round(fw)+'px';f.el.style.height=Math.round(fh)+'px';});
    F.dist=Math.max(0,F.track.scrollWidth-vw);
    F.k=.6;
    film.style.height=(F.pin.offsetHeight+F.dist*F.k)+'px';
    F.top=film.getBoundingClientRect().top+w.scrollY;
    F.items.forEach(function(f){f.l=f.el.offsetLeft;f.w=f.el.offsetWidth;});
    F.cards.forEach(function(c){c.dataset.y=Math.round(F.top+clamp(c.offsetLeft-padL,0,F.dist)*F.k);});
  }
  function updateFilm(y,vw){
    var p=F.dist?clamp((y-F.top)/(F.dist*F.k),0,1):0,x=p*F.dist,fx=vw*(.3+.5*p),best=0,bd=1e9;
    F.track.style.transform='translate3d('+(-x).toFixed(1)+'px,0,0)';
    F.bar.style.setProperty('--fp',p.toFixed(4));
    F.items.forEach(function(f,i){
      var cx=f.l-x+f.w/2,off=(cx-fx)/vw;
      if(off>-1.6&&off<1.6){
        var a=clamp(off*34,-48,48),z=Math.min(Math.abs(off),1.3)*-260;
        f.el.style.transform='translateZ('+z.toFixed(0)+'px) rotateY('+a.toFixed(2)+'deg)';
        if(!f.card)f.img.style.translate=(off*-7).toFixed(2)+'% 0';
      }
      if(!f.card){var dd=Math.abs(cx-fx);if(dd<bd){bd=dd;best=i;}}
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

  // One frame loop for everything tied to scroll or the pointer.
  var nav=d.querySelector('nav'),vh=w.innerHeight,lastY=null,dirty=true;
  function scrolled(y,vw){
    var max=r.scrollHeight-vh;
    nav.classList.toggle('scrolled',y>10);
    nav.style.setProperty('--sp',max>0?(y/max).toFixed(4):0);
    if(film){var fb=film.getBoundingClientRect();nav.classList.toggle('on-dark',fb.top<=nav.offsetHeight&&fb.bottom>nav.offsetHeight);}
    if(reduce)return;
    if(hero)hero.style.setProperty('--hp',clamp(y/hero.offsetHeight,0,1).toFixed(3));
    if(S)updateStack(y,vh);
    if(tline)updateTimeline(vh);
    if(F)updateFilm(y,vw);
  }
  function loop(){
    requestAnimationFrame(loop);
    var y=w.scrollY,dy=lastY===null?0:y-lastY;
    if(dy||dirty){dirty=false;scrolled(y,w.innerWidth);if(cur&&px>=0&&dy)hoverAt(d.elementFromPoint(px,py));}
    lastY=y;
    if(reduce)return;
    if(rib){var b=rib.getBoundingClientRect();if(b.bottom>0&&b.top<vh){var s=sk+(clamp(dy*.3,-9,9)-sk)*.12;if(Math.abs(s-sk)>.005){sk=s;rib.style.setProperty('--sk',sk.toFixed(2)+'deg');}}}
    if(R&&R.vis)updateRing(dy);
    if(springs.length)runSprings();
    if(cur&&(Math.abs(px-cx)>.1||Math.abs(py-cy)>.1)){cx+=(px-cx)*.2;cy+=(py-cy)*.2;cur.style.transform='translate3d('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px,0)';}
  }
  var lastW=w.innerWidth,rt;
  function relayout(){vh=w.innerHeight;layoutStack();layoutFilm();dirty=true;}
  w.addEventListener('resize',function(){
    // Mobile URL bars resize the viewport while scrolling; only re-measure on real changes.
    if(w.innerWidth===lastW&&Math.abs(w.innerHeight-vh)<120)return;
    lastW=w.innerWidth;clearTimeout(rt);rt=setTimeout(relayout,150);
  });
  w.addEventListener('load',relayout);
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(relayout);
  layoutStack();layoutFilm();
  requestAnimationFrame(loop);

  // Reveal on scroll. Held until the intro has lifted.
  var started=false;
  function start(){
    if(started)return;started=true;
    r.classList.remove('cover');
    all('[data-intro]').forEach(function(el){el.classList.add('in');});
    var els=all('.reveal');
    if(!('IntersectionObserver' in w)){els.forEach(function(el){el.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){io.observe(el);});
    if(reduce)return;
    var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){countUp(e.target);co.unobserve(e.target);}});},{threshold:.6});
    all('.stat b,.project li b,.p-type .big').forEach(function(el){co.observe(el);});
  }

  // Intro: a short preloader on the first visit, a curtain after moving between pages.
  var MARK='<span class="mark" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="13.5" cy="16" r="6.5"/><path d="M13.5 9.5H25"/></svg></span>';
  function curtain(cls){var c=d.createElement('div');c.className='curtain '+(cls||'');c.setAttribute('aria-hidden','true');c.innerHTML=MARK;d.body.appendChild(c);return c;}
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
    L.innerHTML='<div class="ld-in"><div class="ld-logo">'+MARK+'<span>Subham Agrawal</span></div><p class="ld-tag"></p><div class="ld-row"><span class="ld-bar"><i></i></span><span class="ld-num">000</span></div></div>';
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

  // Page transitions: the page tips back into the distance as a curtain rises over it.
  d.addEventListener('click',function(e){
    if(reduce||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||a.target||a.hasAttribute('download'))return;
    var u=new URL(a.href,location.href);
    if(u.origin!==location.origin||u.pathname===location.pathname||!/(\.html|\/)$/.test(u.pathname))return;
    e.preventDefault();
    var o='50% '+Math.round(w.scrollY+vh/2)+'px';
    all('main,footer').forEach(function(el){el.style.transformOrigin=el.tagName==='MAIN'?o:'50% 0';});
    r.classList.add('leaving');
    var c=curtain('enter');void c.offsetWidth;c.classList.remove('enter');
    store('pt','1');
    setTimeout(function(){location.href=u.href;},650);
  });
  w.addEventListener('pageshow',function(e){
    if(!e.persisted)return;
    all('.curtain').forEach(function(c){c.remove();});
    r.classList.remove('leaving');
  });

  var copy=d.getElementById('copy');
  if(copy)copy.addEventListener('click',function(){
    var done=function(){copy.textContent='Copied ✓';setTimeout(function(){copy.textContent='Copy email';},1800);};
    if(navigator.clipboard)navigator.clipboard.writeText('b23ci1038@iitj.ac.in').then(done,function(){});
  });

  // Lightbox for the photos, with arrows, keys and swipe.
  var lb=d.getElementById('lightbox');
  if(lb){
    var figs=all('.gallery figure'),cur2=0,li=lb.querySelector('img'),lp=lb.querySelector('p'),x0=null;
    function show(i){
      cur2=(i+figs.length)%figs.length;
      var im=figs[cur2].querySelector('img');
      li.src=im.currentSrc||im.src;li.alt=im.alt;
      lp.textContent=figs[cur2].querySelector('figcaption').textContent+'  ·  '+(cur2+1)+' / '+figs.length;
      li.classList.remove('pop');void li.offsetWidth;li.classList.add('pop');
    }
    function open(i){show(i);lb.classList.add('open');if(lenis)lenis.stop();}
    function close(){lb.classList.remove('open');if(lenis)lenis.start();}
    figs.forEach(function(f,i){
      f.tabIndex=0;f.setAttribute('role','button');
      f.addEventListener('click',function(){open(i);});
      f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i);}});
    });
    lb.querySelector('.lb-prev').addEventListener('click',function(e){e.stopPropagation();show(cur2-1);});
    lb.querySelector('.lb-next').addEventListener('click',function(e){e.stopPropagation();show(cur2+1);});
    lb.addEventListener('click',function(e){if(e.target!==li)close();});
    d.addEventListener('keydown',function(e){
      if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(cur2-1);else if(e.key==='ArrowRight')show(cur2+1);
    });
    lb.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
    lb.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)show(cur2+(dx<0?1:-1));});
  }
})();
