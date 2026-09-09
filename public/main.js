import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHouse } from './model.js';
import { addRealism } from './realism.js';
import { createCinematic } from './cinematic.js';
import { createWalkWorld, createWalker, attachWalkInput } from './walkthrough.js';

const $=s=>document.querySelector(s);
window.addEventListener('error',e=>{$('#failure').hidden=false;$('#failure').textContent=e.message;});
window.addEventListener('unhandledrejection',e=>{$('#failure').hidden=false;$('#failure').textContent=String(e.reason);});
try {
  window.lucide?.createIcons();
  const data=await fetch('model-data.json').then(r=>r.json());
  const renderer=new T.WebGLRenderer({canvas:$('#scene'),antialias:true,preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.90;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.localClippingEnabled=true;
  const scene=new T.Scene();scene.background=new T.Color('#cddce0');scene.fog=new T.Fog('#cddce0',230,650);
  const pmrem=new T.PMREMGenerator(renderer),envScene=new RoomEnvironment();scene.environment=pmrem.fromScene(envScene,.04).texture;scene.environmentIntensity=.55;envScene.dispose();pmrem.dispose();
  const house=buildHouse(data);scene.add(house.root);
  const hemi=new T.HemisphereLight('#c3cddb','#726756',.55);scene.add(hemi);
  const sun=new T.DirectionalLight('#ffc18b',1.8);sun.position.set(-42,10,-22);sun.target.position.set(-6,0,0);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(3072,3072);Object.assign(sun.shadow.camera,{left:-39,right:39,top:34,bottom:-34,near:1,far:130});sun.shadow.bias=-.00018;sun.shadow.normalBias=.04;sun.shadow.radius=3;
  const fill=new T.DirectionalLight('#c3d4eb',.12);fill.position.set(35,18,40);scene.add(fill);
  const realism=await addRealism(house,scene,renderer);
  const tour=createCinematic(house);let cinematicMode=false;
  const camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.08,350);
  const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.12;orbit.maxPolarAngle=Math.PI*.493;orbit.minDistance=.3;orbit.maxDistance=150;orbit.enablePan=true;
  let activeCamera=camera,view='general',capturing=false,lastFrame=0;
  const composer=new EffectComposer(renderer),renderPass=new RenderPass(scene,activeCamera);
  const ao=new SSAOPass(scene,activeCamera,innerWidth,innerHeight);ao.kernelRadius=1.35;ao.minDistance=.003;ao.maxDistance=.10;ao.enabled=innerWidth>650;
  composer.addPass(renderPass);composer.addPass(ao);composer.addPass(new OutputPass());
  const configs={
    general:{name:'Vista general',pos:[-48,43,56],target:[-1,0,0]},
    patios:{name:'Galería y patios',pos:house.pt(1020,1120,2.35).toArray(),target:house.pt(1510,850,1.65).toArray()},
    acceso:{name:'Acceso y consulta',pos:house.pt(2160,1430,2.2).toArray(),target:house.pt(1740,1415,1.6).toArray()},
    living:{name:'Living-comedor y cocina',pos:house.pt(1385,1040,1.67).toArray(),target:house.pt(1665,865,1.40).toArray()},
    salon:{name:'Living',pos:house.pt(1465,945,1.67).toArray(),target:house.pt(1515,1220,1.25).toArray()},
    livingHall:{name:'Living hacia el hall',pos:house.pt(1410,1130,1.67).toArray(),target:house.pt(1680,1290,1.55).toArray()},
    hall:{name:'Hall de entrada y jardín interior',pos:house.pt(1700,1280,1.67).toArray(),target:house.pt(1675,1530,1.55).toArray()},
    kitchen:{name:'Cocina',pos:house.pt(1665,1010,1.67).toArray(),target:house.pt(1825,802,1.2).toArray()},
    quincho:{name:'Quincho',pos:house.pt(1280,518,1.75).toArray(),target:house.pt(1600,243,1.45).toArray()},
    banoQuincho:{name:'Baño quincho',pos:house.pt(1750,529,1.65).toArray(),target:house.pt(1725,425,1.15).toArray()},
    banoVisitas:{name:'Baño de visitas · lucarna',pos:house.pt(1794,1527,1.60).toArray(),target:house.pt(1840,1540.36,2.52).toArray()},
    visitasDetalle:{name:'Baño de visitas · vanitorio',pos:house.pt(1794,1518,1.60).toArray(),target:house.pt(1829,1575,1.35).toArray()},
    banoUno:{name:'Baño 1',pos:house.pt(847,1701,1.60).toArray(),target:house.pt(807,1780,1.20).toArray()},
    banoDos:{name:'Baño 2',pos:house.pt(1094,1706,1.60).toArray(),target:house.pt(1140,1791,1.25).toArray()},
    vestidor:{name:'Walking closet',pos:house.pt(684,1765,1.60).toArray(),target:house.pt(748,1845,1.35).toArray()},
    lavadero:{name:'Lavadero',pos:house.pt(1935,1074,1.60).toArray(),target:house.pt(1990,1133,1.20).toArray()},
    despensa:{name:'Despensa',pos:house.pt(1760,1090,1.60).toArray(),target:house.pt(1820,1136,1.25).toArray()},
    lucarnaCocina:{name:'Lucarna de cocina',pos:house.pt(1680,1013,1.60).toArray(),target:house.pt(1700,1118,2.98).toArray()},
    principal:{name:'Dormitorio principal',pos:house.pt(443,1577,1.65).toArray(),target:house.pt(610,1435,1.10).toArray()},
    dormitorio1:{name:'Dormitorio 1',pos:house.pt(827,1502,1.65).toArray(),target:house.pt(727,1468,1.10).toArray()},
    dormitorio2:{name:'Dormitorio 2',pos:house.pt(1111,1502,1.65).toArray(),target:house.pt(1200,1468,1.10).toArray()},
    dormitorio3:{name:'Dormitorio 3',pos:house.pt(1220,1718,1.65).toArray(),target:house.pt(1320,1780,1.10).toArray()},
    dormitorio4:{name:'Dormitorio 4',pos:house.pt(1830,1193,1.65).toArray(),target:house.pt(1845,1280,1.10).toArray()},
    banoPrincipal:{name:'Baño principal',pos:house.pt(549,1677,1.62).toArray(),target:house.pt(460.5,1746.7,.50).toArray()},
    banoVanitorio:{name:'Baño principal · vanitorio',pos:house.pt(544,1757,1.60).toArray(),target:house.pt(473,1626,1.20).toArray()},
    estar:{name:'Sala de estar',pos:house.pt(920,1695,1.65).toArray(),target:house.pt(975,1440,1.50).toArray()},
    consulta:{name:'Consulta',pos:house.pt(1720,1654,1.65).toArray(),target:house.pt(1880,1721,1.2).toArray()},
  };
  for(const key of ['dormitorio1','dormitorio2','dormitorio3','dormitorio4','banoVisitas','visitasDetalle','banoUno','banoDos','vestidor','lavadero','despensa','lucarnaCocina']){
    const option=document.createElement('option');option.value=key;option.textContent=configs[key].name;$('#room').append(option);
  }
  let walkWorld,walker,walkInput,walkRoom='hall',nearDoor=null;
  const walkAnchors={salon:{position:[1393,1100],target:[1556,1190]},kitchen:{position:[1700,1015],target:[1810,870]},acceso:{position:[1940,1438.5],target:[1763.68,1438.5]},patios:{position:[1300,1120],target:[1510,850]}};
  const walkDestinations=['hall','salon','living','kitchen','lavadero','despensa','principal','dormitorio1','dormitorio2','dormitorio3','dormitorio4','vestidor','banoPrincipal','banoVisitas','banoUno','banoDos','estar','consulta','quincho','banoQuincho','acceso','patios'];
  for(const key of walkDestinations){const option=document.createElement('option');option.value=key;option.textContent=configs[key].name;$('#walk-room').append(option);}
  function syncWalk(){
    if(!walker?.active)return;
    $('#walk-distance').textContent=`${walker.distance.toFixed(1).replace('.',',')} m`;
    $('#walk-state').textContent=walker.paused?'En pausa':'En vivo';document.body.classList.toggle('walk-paused',walker.paused);
    const label=walker.paused?'Continuar caminata':'Pausar caminata';
    if($('#walk-pause').getAttribute('aria-label')!==label){$('#walk-pause').setAttribute('aria-label',label);$('#walk-pause').title=label;$('#walk-pause').innerHTML=`<i data-lucide="${walker.paused?'play':'pause'}"></i>`;window.lucide?.createIcons();}
    nearDoor=walkWorld.nearbyDoor(camera.position);$('#walk-door').disabled=!nearDoor||walker.paused;
    const doorLabel=nearDoor?`${nearDoor.open?'Cerrar':'Abrir'} ${nearDoor.label.toLowerCase()}`:'Accionar puerta';$('#walk-door').title=`${doorLabel} · E`;$('#walk-door').setAttribute('aria-label',doorLabel);
  }
  function pauseWalk(value=true){if(!walker?.active)return;walkInput.clear();walker.pause(value);if(value)walkInput.unlock();syncWalk();}
  function interactDoor(){
    if(!nearDoor||!walker?.active||walker.paused)return;
    if(!walkWorld.setDoor(nearDoor,!nearDoor.open,camera.position,walker.floor))toast('Deja libre el giro de la puerta');
    $('#kitchen-door').checked=house.kitchenDoor.userData.open;syncWalk();
  }
  function startWalk(next=walkRoom){
    if(!walkDestinations.includes(next))next='hall';
    stopTour();
    if(!walker){walkWorld=createWalkWorld(house);walker=createWalker(camera,walkWorld);walkInput=attachWalkInput(walker,renderer.domElement,{onPause:pauseWalk,onInteract:interactDoor,onLockError:()=>toast('Puedes mirar arrastrando sobre la escena')});}
    walkInput.clear();
    const c=configs[next],anchor=walkAnchors[next],position=anchor?house.pt(...anchor.position,1.697):new T.Vector3().fromArray(c.pos),target=anchor?house.pt(...anchor.target,1.35):new T.Vector3().fromArray(c.target);
    if(!walker.enter(position,target)){
      if(next==='hall'){toast('No hay espacio libre en este punto');return;}
      toast('Este encuadre está junto a un mueble; el recorrido comienza en el hall');return startWalk('hall');
    }
    walkRoom=next;view='walkthrough';activeCamera=camera;renderPass.camera=camera;ao.camera=camera;orbit.enabled=false;
    camera.fov=innerWidth<650?74:65;camera.updateProjectionMatrix();
    house.roofs.visible=true;$('#roof').checked=true;$('#roof').disabled=true;
    $('#panel').hidden=true;$('#settings').setAttribute('aria-expanded','false');
    document.body.classList.add('walking');$('#walk').setAttribute('aria-pressed','true');
    for(const id of ['walk-controls','walk-movement','walk-look'])$('#'+id).hidden=false;
    $('#walk-room').value=next;$('#room').value=next;syncWalk();
  }
  function stopWalk(){
    if(!walker?.active)return;walker.exit();walkInput.clear();walkInput.unlock();
    orbit.target.copy(camera.position).add(camera.getWorldDirection(new T.Vector3()).multiplyScalar(3));orbit.enabled=true;
    document.body.classList.remove('walking','walk-paused');$('#walk').setAttribute('aria-pressed','false');
    for(const id of ['walk-controls','walk-movement','walk-look'])$('#'+id).hidden=true;
    $('#roof').disabled=false;
  }
  function updateProjection(w,h){
    if(view==='acceso'&&!walker?.active&&!cinematicMode)camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(43/2))*Math.max(1,.72/(w/h))));
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function fitGeneral(w,h){
    const center=new T.Vector3(-2,1.2,0),dir=new T.Vector3(-.85,.9,1.1).normalize();
    const forward=dir.clone().negate(),right=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0)).normalize(),up=new T.Vector3().crossVectors(right,forward);
    const tv=Math.tan(T.MathUtils.degToRad(camera.fov/2)),th=tv*w/h;
    let distance=0;
    for(const [,r] of data.rooms)for(const x of [r[0],r[2]])for(const z of [r[1],r[3]])for(const y of [0,4.6]){const v=house.pt(x,z,y).sub(center);distance=Math.max(distance,Math.abs(v.dot(right))/(th*.91)-v.dot(forward),Math.abs(v.dot(up))/(tv*.86)-v.dot(forward));}
    orbit.target.copy(center);camera.position.copy(center).addScaledVector(dir,distance);orbit.update();
  }
  function setView(next){
    if(!Object.hasOwn(configs,next))return;
    const c=configs[next];stopWalk();stopTour();view=next;
    activeCamera=camera;orbit.enabled=true;
    renderPass.camera=activeCamera;ao.camera=activeCamera;
    house.roofs.visible=true;$('#roof').checked=true;
    house.plants.visible=true;$('#plants').checked=true;
      orbit.maxPolarAngle=['banoVisitas','lucarnaCocina'].includes(next)?Math.PI-.01:Math.PI*.493;
      camera.fov=next==='banoPrincipal'?76:['hall','banoQuincho','banoVanitorio','banoVisitas','visitasDetalle','banoUno','banoDos','vestidor','lavadero','despensa','lucarnaCocina'].includes(next)?70:['living','salon','livingHall','kitchen','principal','dormitorio1','dormitorio2','dormitorio3','dormitorio4','estar','consulta','quincho'].includes(next)?61:43;updateProjection(innerWidth,innerHeight);
      camera.position.fromArray(c.pos);orbit.target.fromArray(c.target);
      if(next==='general')fitGeneral(innerWidth,innerHeight);
      orbit.update();
    $('#view-name').textContent=c.name;$('#mode-label').textContent='PERSPECTIVA';
    $('#room').value=[...$('#room').options].some(option=>option.value===next)?next:'';
    document.querySelectorAll('[data-view]').forEach(b=>{const selected=b.dataset.view===next||(b.dataset.view==='salon'&&['livingHall','living'].includes(next));b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  }
  function render(){realism.updateLights(activeCamera);composer.render();}
  function setSun(value){
    const t=Number(value)/100;sun.position.set(-43,24-t*19,-26);sun.color.setRGB(1,.85-t*.22,.66-t*.24,T.SRGBColorSpace);sun.intensity=2.3-t*.75;
    hemi.intensity=.72-t*.28;scene.environmentIntensity=.50-t*.18;scene.backgroundIntensity=.65-t*.24;renderer.toneMappingExposure=1.02-t*.13;
    $('#sun-value').textContent=t>.65?'Hora mágica':t>.3?'Tarde cálida':'Tarde';
  }
  const clockText=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  function syncTour(){
    const s=tour.sample();$('#shot-name').textContent=s.name;$('#tour-time').textContent=`${clockText(tour.time)} / ${clockText(tour.duration)}`;$('#tour-progress').value=tour.time;
    const label=tour.playing?'Pausar recorrido':'Reproducir recorrido';
    if($('#tour-play').getAttribute('aria-label')!==label){$('#tour-play').setAttribute('aria-label',label);$('#tour-play').title=label;$('#tour-play').innerHTML=`<i data-lucide="${tour.playing?'pause':'play'}"></i>`;window.lucide?.createIcons();}
  }
  function applyTour(s){
    camera.position.copy(s.position);camera.fov=s.fov;camera.updateProjectionMatrix();camera.lookAt(s.target);orbit.target.copy(s.target);$('#cinema-fade').style.opacity=tour.playing?s.fade:0;syncTour();
  }
  function startTour(){
    if(!cinematicMode){setView('acceso');cinematicMode=true;view='cinematic';document.body.classList.add('cinematic');$('#cinema-controls').hidden=false;$('#cinema').setAttribute('aria-pressed','true');$('#panel').hidden=true;$('#settings').setAttribute('aria-expanded','false');}
    tour.play();orbit.enabled=false;applyTour(tour.sample());
  }
  function stopTour(){
    if(!cinematicMode)return;tour.pause();cinematicMode=false;orbit.enabled=true;$('#cinema-controls').hidden=true;$('#cinema').setAttribute('aria-pressed','false');document.body.classList.remove('cinematic');$('#cinema-fade').style.opacity=0;
  }
  function resize(){if(capturing)return;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);if(walker?.active)camera.fov=innerWidth<650?74:65;updateProjection(innerWidth,innerHeight);ao.enabled=innerWidth>650;if(view==='general')fitGeneral(innerWidth,innerHeight);}
  let toastTimer;function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
  function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
  function pixelCheck(){
    const w=renderer.domElement.width,h=renderer.domElement.height,gl=renderer.getContext(),pixel=new Uint8Array(4);let sum=0,sum2=0,count=0,min=255,max=0;
    for(let yy=1;yy<14;yy++)for(let xx=1;xx<20;xx++){gl.readPixels(Math.floor(xx*w/20),Math.floor(yy*h/14),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);const v=(pixel[0]+pixel[1]+pixel[2])/3;sum+=v;sum2+=v*v;min=Math.min(min,v);max=Math.max(max,v);count++;}
    const variance=sum2/count-(sum/count)**2;return {width:w,height:h,variance:Math.round(variance),min,max,nonblank:variance>40&&max-min>40};
  }
  async function capture(name,width=2560,height=1440){
    capturing=true;const oldRatio=renderer.getPixelRatio(),oldPosition=camera.position.clone(),oldTarget=orbit.target.clone(),oldQuaternion=camera.quaternion.clone(),oldFov=camera.fov;
    if(walker?.active)camera.fov=width<650?74:65;
    renderer.setPixelRatio(1);composer.setPixelRatio(1);renderer.setSize(width,height,false);composer.setSize(width,height);updateProjection(width,height);ao.enabled=width>650;
    if(view==='general')fitGeneral(width,height);
    render();render();
    const stats=pixelCheck();
    const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
    download(blob,`${name}.png`);
    camera.position.copy(oldPosition);camera.fov=oldFov;orbit.target.copy(oldTarget);if(walker?.active)camera.quaternion.copy(oldQuaternion);else orbit.update();renderer.setPixelRatio(oldRatio);composer.setPixelRatio(oldRatio);capturing=false;resize();render();
    return stats;
  }
  function animate(now){
    requestAnimationFrame(animate);if(capturing||now-lastFrame<32)return;const dt=(now-lastFrame)/1000;lastFrame=now;
    if(walker?.active){walker.tick(dt);syncWalk();}
    else if(cinematicMode&&tour.playing){applyTour(tour.tick(dt));if(!tour.playing){orbit.enabled=true;$('#cinema-fade').style.opacity=0;syncTour();}}
    else if(orbit.enabled)orbit.update();
    render();
  }
  window.addEventListener('resize',resize);
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  const panel=show=>{$('#panel').hidden=!show;$('#settings').setAttribute('aria-expanded',String(show));if(show)pauseWalk(true);};
  $('#settings').onclick=()=>panel($('#panel').hidden);$('#close-panel').onclick=()=>panel(false);
  $('#roof').onchange=e=>house.roofs.visible=e.target.checked;
  $('#furniture').onchange=e=>house.furniture.visible=e.target.checked;
  $('#kitchen-door').onchange=e=>{if(walkWorld){const d=house.interactiveDoors.find(d=>d.object===house.kitchenDoor);if(!walkWorld.setDoor(d,e.target.checked,walker.active?camera.position:null,walker.floor))toast('Deja libre el paso antes de cerrar');e.target.checked=house.kitchenDoor.userData.open;}else house.setKitchenDoorOpen(e.target.checked);};
  $('#plants').onchange=e=>house.plants.visible=e.target.checked;
  $('#sun').oninput=e=>setSun(e.target.value);
  $('#lamps').onchange=e=>realism.setLighting(e.target.checked);
  $('#cinema').onclick=()=>{if(cinematicMode){stopTour();setView('living');}else startTour();};
  $('#walk').onclick=()=>{if(walker?.active)setView(walkRoom);else startWalk(walkDestinations.includes(view)?view:'hall');};
  $('#walk-close').onclick=()=>setView(walkRoom);
  $('#walk-pause').onclick=()=>pauseWalk(!walker.paused);
  $('#walk-lock').onclick=()=>walkInput.lock();
  $('#walk-door').onclick=interactDoor;
  $('#walk-room').onchange=e=>startWalk(e.target.value);
  $('#walk-speed').onchange=e=>walker.setSpeed(e.target.value);
  $('#tour-play').onclick=()=>{if(tour.playing){tour.pause();orbit.enabled=true;$('#cinema-fade').style.opacity=0;syncTour();}else startTour();};
  $('#tour-prev').onclick=()=>{tour.chapter(-1);applyTour(tour.sample());};
  $('#tour-next').onclick=()=>{tour.chapter(1);applyTour(tour.sample());};
  $('#tour-progress').max=tour.duration;
  $('#tour-progress').oninput=e=>{tour.seek(e.target.value);applyTour(tour.sample());};
  $('#tour-speed').onchange=e=>tour.setSpeed(e.target.value);
  $('#tour-close').onclick=()=>{stopTour();setView('living');};
  document.querySelectorAll('[data-material]').forEach(b=>b.onclick=()=>{house.setMaterial(b.dataset.material);document.querySelectorAll('[data-material]').forEach(el=>el.classList.toggle('active',el===b));});
  $('#room').onchange=e=>{if(e.target.value){if(walker?.active)startWalk(e.target.value);else setView(e.target.value);}};
  $('#reset').onclick=()=>setView('general');
  $('#snapshot').onclick=async()=>{toast('Preparando render…');await capture(`casa-${view}`);toast('Render descargado');};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){panel(false);if(cinematicMode){stopTour();setView('living');}}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&tour.playing){tour.pause();orbit.enabled=true;syncTour();}});
  updateProjection(innerWidth,innerHeight);setSun($('#sun').value);setView('general');
  await new Promise(r=>setTimeout(r,150));render();$('#loading').style.display='none';
  requestAnimationFrame(animate);
  const params=new URLSearchParams(location.search);
  if(params.has('cinema'))startTour();
  else if(params.get('walk')==='0'&&Object.hasOwn(configs,params.get('view')))setView(params.get('view'));
  else startWalk(params.get('view')||'salon');
  render();
  const pixels=pixelCheck();$('#scene').dataset.renderStatus=pixels.nonblank?'ready':'blank';$('#scene').dataset.pixelVariance=String(pixels.variance);
}catch(e){$('#loading').style.display='none';$('#failure').hidden=false;$('#failure').textContent=`No se pudo iniciar la escena: ${e.message}`;console.error(e);}
