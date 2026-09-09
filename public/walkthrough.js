import * as T from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

export const WALK={radius:.19,eye:1.65,height:1.78,step:.14,speed:1.25};
const up=new T.Vector3(0,1,0);
class WalkOctree extends Octree {
  build(){
    // r184 child nodes reset maxLevel; an offset limits subdivision to six levels.
    this.calcBox();this.split(11);return this;
  }
}
function octree(){return new WalkOctree();}
function capsuleAt(p,floor){return new Capsule(new T.Vector3(p.x,floor+.09+WALK.radius,p.z),new T.Vector3(p.x,floor+WALK.height-WALK.radius,p.z),WALK.radius);}

function addGeometry(tree,geometry,matrix,doubleSided=false){
  const p=geometry.attributes.position,index=geometry.index;
  for(let i=0;i<(index?.count??p.count);i+=3){
    const v=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(matrix));
    tree.addTriangle(new T.Triangle(...v));
    if(doubleSided)tree.addTriangle(new T.Triangle(v[2].clone(),v[1].clone(),v[0].clone()));
  }
}
function addBox(tree,bounds,matrix=new T.Matrix4()){
  if(bounds.isEmpty())return;
  const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  size.max(new T.Vector3(.018,.018,.018));
  const geo=new T.BoxGeometry(size.x,size.y,size.z);geo.translate(center.x,center.y,center.z);
  addGeometry(tree,geo,matrix);geo.dispose();
}
function indexGeometry(root,tree){
  if(root.userData.dynamicDoor)return;
  if(root.isMesh&&!root.isInstancedMesh){
    const mats=Array.isArray(root.material)?root.material:[root.material];
    addGeometry(tree,root.geometry,root.matrixWorld,mats.some(m=>m.side===T.DoubleSide));
  }
  for(const child of root.children)indexGeometry(child,tree);
}

export function createWalkWorld(house){
  house.root.updateMatrixWorld(true);
  const architecture=octree(),ground=octree(),furniture=octree();
  // The octrees retain the plan geometry; furniture uses inexpensive oriented bounds.
  indexGeometry(house.structure,architecture);indexGeometry(house.roofs,architecture);architecture.build();
  for(const root of [house.structure,house.site])indexGeometry(root,ground);
  ground.build();
  function indexFurniture(o){
    if(o.userData.wallMounted)return;
    if(o.userData.asset){addBox(furniture,new T.Box3().setFromObject(o));return;}
    if(o.isMesh&&!o.isInstancedMesh){
      o.geometry.computeBoundingBox();const local=o.geometry.boundingBox;
      const world=local.clone().applyMatrix4(o.matrixWorld);
      if(world.max.y>.17&&world.min.y<1.85)addBox(furniture,local,o.matrixWorld);
    }
    for(const child of o.children)indexFurniture(child);
  }
  indexFurniture(house.furniture);furniture.build();
  let doors;
  function refreshDoors(){
    doors=octree();house.root.updateMatrixWorld(true);
    for(const d of house.interactiveDoors){d.object.traverse(o=>{if(o.isMesh)addGeometry(doors,o.geometry,o.matrixWorld,true);});}
    doors.build();
  }
  refreshDoors();
  const bounds=new T.Box3().setFromObject(house.structure);bounds.expandByScalar(12);
  const down=new T.Vector3(0,-1,0);
  function floorAt(p,previous=.047){
    const hit=ground.rayIntersect(new T.Ray(new T.Vector3(p.x,previous+WALK.step+.01,p.z),down));
    return hit&&hit.distance<.8?hit.position.y:null;
  }
  function trees(){return house.furniture.visible?[architecture,furniture,doors]:[architecture,doors];}
  function clearAt(p,floor){return trees().every(t=>{const h=t.capsuleIntersect(capsuleAt(p,floor));return !h||h.depth<.002;});}
  function move(p,delta,floor){
    const next=p.clone().add(delta),newFloor=floorAt(next,floor);
    if(newFloor===null||Math.abs(newFloor-floor)>WALK.step||next.x<bounds.min.x||next.x>bounds.max.x||next.z<bounds.min.z||next.z>bounds.max.z)return {position:p.clone(),floor};
    const capsule=capsuleAt(next,newFloor);
    for(let iteration=0;iteration<4;iteration++)for(const tree of trees()){
      const hit=tree.capsuleIntersect(capsule);
      if(hit&&hit.depth>.00001){
        // Stay upright: do not climb furniture or float up wall edges.
        if(Math.abs(hit.normal.y)>.6)return {position:p.clone(),floor};
        const correction=hit.normal.clone();correction.y=0;correction.normalize().multiplyScalar(hit.depth+.0002);capsule.translate(correction);
      }
    }
    next.x=capsule.start.x;next.z=capsule.start.z;
    const settled=floorAt(next,newFloor);
    if(settled===null||Math.abs(settled-floor)>WALK.step||!clearAt(next,settled))return {position:p.clone(),floor};
    next.y=settled+WALK.eye;return {position:next,floor:settled};
  }
  function spawn(position){
    if(position.x<bounds.min.x||position.x>bounds.max.x||position.z<bounds.min.z||position.z>bounds.max.z)return null;
    const floor=floorAt(position);
    if(floor===null||!clearAt(position,floor))return null;
    const p=position.clone();p.y=floor+WALK.eye;return {position:p,floor};
  }
  function nearbyDoor(p){
    let nearest=null,distance=1.85;
    for(const door of house.interactiveDoors){
      const target=door.point.clone();target.y=p.y;const d=p.distanceTo(target);
      if(d>=distance)continue;
      const obstruction=architecture.rayIntersect(new T.Ray(p,target.clone().sub(p).normalize()));
      if(obstruction&&obstruction.distance<d-.12)continue;
      nearest=door;distance=d;
    }
    return nearest;
  }
  function setDoor(door,open,p,floor){
    const oldRotation=door.object.rotation.clone(),oldPosition=door.object.position.clone();
    door.setOpen(open);refreshDoors();
    if(p&&!clearAt(p,floor)){
      door.setOpen(!open);door.object.rotation.copy(oldRotation);door.object.position.copy(oldPosition);refreshDoors();return false;
    }
    return true;
  }
  return {architecture,furniture,ground,refreshDoors,floorAt,clearAt,move,spawn,nearbyDoor,setDoor};
}

export function createWalker(camera,world){
  const velocity=new T.Vector3(),axis=new T.Vector2();
  let floor=.047,yaw=0,pitch=0,targetYaw=0,targetPitch=0,speed=WALK.speed,distance=0,active=false,paused=false,turn=0;
  const rotation=new T.Euler(0,0,0,'YXZ');
  function resetInput(){axis.set(0,0);velocity.set(0,0,0);turn=0;}
  function orient(){rotation.set(pitch,yaw,0);camera.quaternion.setFromEuler(rotation);}
  function enter(position,target){
    const spawn=world.spawn(position);if(!spawn)return false;
    floor=spawn.floor;camera.position.copy(spawn.position);camera.lookAt(target);rotation.setFromQuaternion(camera.quaternion,'YXZ');
    yaw=targetYaw=rotation.y;pitch=targetPitch=T.MathUtils.clamp(rotation.x,-1.35,1.35);
    active=true;paused=false;distance=0;resetInput();orient();return true;
  }
  function translate(delta){const before=camera.position.clone(),result=world.move(camera.position,delta,floor);camera.position.copy(result.position);floor=result.floor;distance+=Math.hypot(before.x-camera.position.x,before.z-camera.position.z);}
  function direction(x,z){return new T.Vector3(x,0,-z).applyAxisAngle(up,yaw);}
  function tick(dt){
    if(!active||paused)return;
    dt=T.MathUtils.clamp(dt,0,.1);
    const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;
    for(let i=0;i<steps;i++){
      targetYaw+=turn*h*1.2;yaw=T.MathUtils.damp(yaw,targetYaw,16,h);pitch=T.MathUtils.damp(pitch,targetPitch,16,h);
      const desired=direction(axis.x,axis.y).multiplyScalar(speed),a=1-Math.exp(-10*h);
      velocity.lerp(desired,a);translate(velocity.clone().multiplyScalar(h));
    }
    orient();
  }
  return {
    enter,tick,resetInput,
    exit(){active=false;resetInput();},
    pause(value=true){paused=value;resetInput();targetYaw=yaw;targetPitch=pitch;},
    move(x,z){axis.set(x,z);if(axis.length()>1)axis.normalize();},
    look(dx,dy){if(active&&!paused){targetYaw-=dx;targetPitch=T.MathUtils.clamp(targetPitch-dy,-1.35,1.35);}},
    turn(value){turn=value;},
    nudge(x,z){if(active&&!paused)for(let i=0;i<6;i++)translate(direction(x,z).normalize().multiplyScalar(.03));},
    setSpeed(value){speed=T.MathUtils.clamp(Number(value)||WALK.speed,.5,2);},
    get active(){return active;},get paused(){return paused;},get floor(){return floor;},get distance(){return distance;},
  };
}

export function attachWalkInput(walker,canvas,{onPause,onInteract,onLockError}){
  const keys=new Set(),buttons=new Map();let drag=null;
  const keyAxes={KeyW:[0,1],ArrowUp:[0,1],KeyS:[0,-1],ArrowDown:[0,-1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
  const editable=e=>e.target.closest?.('input,select,textarea,[contenteditable=true]');
  function update(){let x=0,z=0;for(const key of keys){x+=keyAxes[key][0];z+=keyAxes[key][1];}for(const v of buttons.values()){x+=v[0];z+=v[1];}walker.move(x,z);}
  function clear(){keys.clear();buttons.clear();drag=null;walker.resetInput();document.querySelectorAll('.walk-pad .held').forEach(b=>b.classList.remove('held'));}
  function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
  async function lock(){if(!walker.active||walker.paused)return;try{if(!canvas.requestPointerLock)throw Error('unavailable');await canvas.requestPointerLock();}catch{onLockError();}}
  window.addEventListener('keydown',e=>{
    if(!walker.active||editable(e))return;
    if(e.code==='Escape'){clear();unlock();onPause(true);return;}
    if(e.code==='KeyE'&&!e.repeat&&!walker.paused){onInteract();return;}
    if(keyAxes[e.code]&&!walker.paused){e.preventDefault();keys.add(e.code);update();}
  });
  window.addEventListener('keyup',e=>{if(keys.delete(e.code))update();});
  window.addEventListener('blur',()=>{clear();if(walker.active)onPause(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();unlock();if(walker.active)onPause(true);}});
  document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas){clear();if(walker.active)onPause(true);}});
  document.addEventListener('pointerlockerror',onLockError);
  canvas.addEventListener('pointerdown',e=>{
    if(!walker.active||e.button!==0||drag)return;
    if(walker.paused)onPause(false);
    canvas.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(document.pointerLockElement===canvas){walker.look(e.movementX*.002,e.movementY*.002);return;}
    if(!drag||drag.id!==e.pointerId)return;
    const sensitivity=e.pointerType==='touch'?.0035:.0025;walker.look((e.clientX-drag.x)*sensitivity,(e.clientY-drag.y)*sensitivity);drag.x=e.clientX;drag.y=e.clientY;
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(drag?.id===e.pointerId)drag=null;});
  for(const button of document.querySelectorAll('[data-move],[data-turn]')){
    let started=0;
    button.addEventListener('pointerdown',e=>{
      if(!walker.active||walker.paused)return;e.preventDefault();started=performance.now();button.setPointerCapture(e.pointerId);
      if(button.dataset.move)buttons.set(button,button.dataset.move.split(',').map(Number));
      else walker.turn(Number(button.dataset.turn));update();button.classList.add('held');
    });
    function release(e){
      if(e.type==='pointerup'&&started&&performance.now()-started<90){if(button.dataset.move)walker.nudge(...button.dataset.move.split(',').map(Number));else walker.look(-Number(button.dataset.turn)*.16,0);}
      started=0;buttons.delete(button);if(button.dataset.turn)walker.turn(0);update();button.classList.remove('held');
    }
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
    button.addEventListener('click',e=>{if(e.detail===0){if(button.dataset.move)walker.nudge(...button.dataset.move.split(',').map(Number));else walker.look(-Number(button.dataset.turn)*.16,0);}});
  }
  return {clear,lock,unlock};
}
