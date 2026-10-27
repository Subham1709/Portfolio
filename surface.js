// Hero background: an implied-volatility surface drawn in WebGL.
// Height is vol by moneyness (left-right) and maturity (front-back): a skewed smile that
// flattens with maturity over an upward term structure. It is an illustration, not market data.
(function(){
  var cv=document.getElementById('surface');
  if(!cv)return;
  var d=document,r=d.documentElement,w=window;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Phones draw fewer pixels and frames: the surface moves slowly, so 30 fps looks the same and saves battery.
  var coarse=matchMedia('(pointer:coarse)').matches;
  var gl=null;
  try{gl=cv.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});}catch(e){}
  if(!gl){r.classList.add('no-gl');return;}

  // Shape of the surface. vol() in the shader and atm() below must agree.
  var VS=[
    'attribute vec2 a;',
    'uniform float t,yaw,pitch,asp,dist,sx,sy,slice;',
    'varying float h,fog,edge,hi;',
    'float vol(vec2 p){',
    '  float k=p.x,T=p.y;',
    '  float smile=(.55-.38*T)*(sqrt(k*k+.05)-.2236);',
    '  float skew=-(.3-.2*T)*k;',
    '  float term=.24*(1.-exp(-2.8*T));',
    '  float wave=.035*sin(3.2*k+4.5*T-t*.8)+.022*sin(6.*k-3.*T+t*.55);',
    '  return smile+skew+term+wave;',
    '}',
    'void main(){',
    '  h=vol(a);',
    '  vec3 P=vec3(-a.x*1.6,h*1.7-.45,(.5-a.y)*2.1);',
    '  float c=cos(yaw),s=sin(yaw);P=vec3(c*P.x+s*P.z,P.y,-s*P.x+c*P.z);',
    '  c=cos(pitch);s=sin(pitch);P=vec3(P.x,c*P.y-s*P.z,s*P.y+c*P.z);',
    '  float z=dist-P.z;',
    '  fog=clamp(.78+(P.z)*.32,.22,1.);',
    '  edge=smoothstep(1.,.8,abs(a.x))*smoothstep(0.,.12,a.y)*smoothstep(1.,.88,a.y);',
    '  hi=exp(-pow((a.y-slice)*34.,2.));',
    '  gl_Position=vec4(P.x*1.9/asp+sx*z,P.y*1.9+sy*z,0.,z);',
    '}'].join('\n');
  var FS=[
    'precision mediump float;',
    'varying float h,fog,edge,hi;',
    'uniform float alpha,light,fade;',
    'vec3 pal(float x){',
    '  vec3 c0=vec3(.55,.48,1.),c1=vec3(.25,.82,1.),c2=vec3(.76,.96,.24),c3=vec3(1.,.47,.28);',
    '  if(x<.38)return mix(c0,c1,x/.38);',
    '  if(x<.72)return mix(c1,c2,(x-.38)/.34);',
    '  return mix(c2,c3,(x-.72)/.28);',
    '}',
    'void main(){',
    '  vec3 col=pal(clamp(h/.52,0.,1.));',
    '  col=mix(col,vec3(1.),hi*.55);',
    '  if(light>.5)col*=.62;',
    '  gl_FragColor=vec4(col,alpha*(1.+hi*1.8)*edge*fog*fade);',
    '}'].join('\n');

  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){r.classList.add('no-gl');return;}
  gl.useProgram(pr);

  // A grid over moneyness (NX) and maturity (NY): drawn as faint triangles plus brighter lines.
  var NX=64,NY=36,v=new Float32Array(NX*NY*2),i,j,n=0;
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){v[n++]=-1+2*i/(NX-1);v[n++]=j/(NY-1);}
  var L=[],T=[];
  for(j=0;j<NY;j++)for(i=0;i<NX-1;i++)L.push(j*NX+i,j*NX+i+1);
  for(i=0;i<NX;i+=2)for(j=0;j<NY-1;j++)L.push(j*NX+i,(j+1)*NX+i);
  for(j=0;j<NY-1;j++)for(i=0;i<NX-1;i++){var q=j*NX+i;T.push(q,q+1,q+NX,q+1,q+NX+1,q+NX);}
  function buf(target,data){var b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;}
  buf(gl.ARRAY_BUFFER,v);
  var loc=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var lb=buf(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(L)),tb=buf(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(T));
  var U={};['t','yaw','pitch','asp','dist','sx','sy','slice','alpha','light','fade'].forEach(function(k){U[k]=gl.getUniformLocation(pr,k);});
  gl.enable(gl.BLEND);gl.disable(gl.DEPTH_TEST);

  // Readout under the hero: the maturity slice that sweeps across the surface.
  var hT=d.getElementById('hh-t'),hS=d.getElementById('hh-s'),hK=d.getElementById('hh-k'),lastHud=0;
  function atm(T,t){return .24*(1-Math.exp(-2.8*T))+.035*Math.sin(4.5*T-t*.8)+.022*Math.sin(-3*T+t*.55);}
  function slope(T,t){return -(.3-.2*T)+.035*3.2*Math.cos(4.5*T-t*.8)+.022*6*Math.cos(-3*T+t*.55);}
  function minus(x){return x.replace('-','−');}

  var host=cv.parentNode,W=0,H=0,mx=0,my=0,tmx=0,tmy=0,time=0,last=0,vis=true,raf=0;
  function size(){
    var dpr=Math.min(w.devicePixelRatio||1,coarse?1.5:1.75),cw=cv.clientWidth,ch=cv.clientHeight;
    if(cw*dpr!==W||ch*dpr!==H){W=cv.width=Math.round(cw*dpr);H=cv.height=Math.round(ch*dpr);gl.viewport(0,0,W,H);}
  }
  function draw(){
    size();
    var asp=W/H||1,wide=asp>1.1,light=r.getAttribute('data-theme')==='light';
    var hp=Math.min(Math.max(w.scrollY/(host.offsetHeight||1),0),1);
    var slice=.5+.42*Math.sin(time*.32);
    gl.uniform1f(U.t,time);
    gl.uniform1f(U.yaw,(wide?-.5:-.42)+mx*.45+hp*.5);
    gl.uniform1f(U.pitch,(wide?.44:.56)+my*.16+hp*.45);
    gl.uniform1f(U.asp,asp);
    gl.uniform1f(U.dist,(wide?4.4:5.6)+hp*1.4);
    gl.uniform1f(U.sx,wide?.44:0);
    gl.uniform1f(U.sy,wide?-.02:-.4);
    gl.uniform1f(U.slice,slice);
    gl.uniform1f(U.light,light?1:0);
    gl.uniform1f(U.fade,1-hp*.85);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    if(light)gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    else gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE);
    gl.uniform1f(U.alpha,light?.05:.045);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,tb);gl.drawElements(gl.TRIANGLES,T.length,gl.UNSIGNED_SHORT,0);
    gl.uniform1f(U.alpha,light?.5:.5);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,lb);gl.drawElements(gl.LINES,L.length,gl.UNSIGNED_SHORT,0);
    if(hT&&(reduce||time-lastHud>.12)){
      lastHud=time;
      hT.textContent=(slice*2).toFixed(2);
      hS.textContent=(11+atm(slice,time)*38).toFixed(1);
      hK.textContent=minus(slope(slice,time).toFixed(2));
    }
  }
  function loop(ts){
    raf=0;
    if(!(coarse&&last&&ts-last<30)){
      var dt=last?Math.min((ts-last)/1000,.05):0;last=ts;
      time+=dt;mx+=(tmx-mx)*.05;my+=(tmy-my)*.05;
      draw();
    }
    if(vis&&!d.hidden)raf=requestAnimationFrame(loop);
  }
  function go(){if(!raf&&!reduce&&vis&&!d.hidden){last=0;raf=requestAnimationFrame(loop);}}

  if(!reduce&&matchMedia('(hover:hover) and (pointer:fine)').matches)
    w.addEventListener('pointermove',function(e){tmx=e.clientX/w.innerWidth-.5;tmy=e.clientY/w.innerHeight-.5;},{passive:true});
  if('IntersectionObserver' in w)new IntersectionObserver(function(es){vis=es[0].isIntersecting;go();}).observe(host);
  d.addEventListener('visibilitychange',go);
  w.addEventListener('resize',function(){if(reduce)draw();});
  new MutationObserver(function(){if(reduce||!raf)draw();}).observe(r,{attributes:true,attributeFilter:['data-theme']});
  if(reduce){time=2;draw();}else go();
})();
