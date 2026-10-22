(function(){
  var r=document.documentElement;
  try{var s=localStorage.getItem('theme');if(s)r.setAttribute('data-theme',s);}catch(e){}
  var t=document.getElementById('theme');
  function isDark(){var a=r.getAttribute('data-theme');return a?a==='dark':matchMedia('(prefers-color-scheme: dark)').matches;}
  function icon(){if(t)t.textContent=isDark()?'☀':'☾';}
  icon();
  if(t)t.addEventListener('click',function(){
    var n=isDark()?'light':'dark';r.setAttribute('data-theme',n);icon();
    try{localStorage.setItem('theme',n);}catch(e){}
  });

  var nav=document.querySelector('nav');
  function onScroll(){nav.classList.toggle('scrolled',window.scrollY>10);}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  // Fade sections in as they scroll into view.
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){io.observe(el);});
  }else{els.forEach(function(el){el.classList.add('in');});}

  var copy=document.getElementById('copy');
  if(copy)copy.addEventListener('click',function(){
    var done=function(){copy.textContent='Copied ✓';setTimeout(function(){copy.textContent='Copy email';},1800);};
    if(navigator.clipboard)navigator.clipboard.writeText('b23ci1038@iitj.ac.in').then(done,function(){});
  });

  // Lightbox for the photo gallery.
  var lb=document.getElementById('lightbox');
  if(lb){
    var li=lb.querySelector('img'),lp=lb.querySelector('p');
    document.querySelectorAll('.gallery figure').forEach(function(f){
      f.addEventListener('click',function(){
        var im=f.querySelector('img');li.src=im.src;li.alt=im.alt;lp.textContent=f.querySelector('figcaption').textContent;lb.classList.add('open');
      });
    });
    function close(){lb.classList.remove('open');}
    lb.addEventListener('click',function(e){if(e.target!==li)close();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  }
})();
