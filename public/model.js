import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildMasterBathroom } from './master-bathroom.js';
import { buildConstructionDetails } from './construction-details.js';

export function buildHouse(data) {
  const root=new T.Group();root.name='Casa Faz - De la Sotta';
  const structure=new T.Group(), roofs=new T.Group(), furniture=new T.Group(), plants=new T.Group(), site=new T.Group();
  root.add(structure,roofs,furniture,plants,site);
  structure.name='Muros y vanos G01';roofs.name='Techumbre G02 y cortes';furniture.name='Mobiliario referencial';plants.name='Paisajismo referencial';site.name='Terreno y pavimentos';
  const ceilings=new T.Group();ceilings.name='Cielos interiores cerrados - G04 G05';roofs.add(ceilings);
  const S=data.scalePointsPerMetre,[ox,oz]=data.origin;
  const X=x=>(x-ox)/S-24, Z=z=>(z-oz)/S-16;
  const pt=(x,z,y=0)=>new T.Vector3(X(x),y,Z(z));
  let seed=6426;
  const rnd=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  function texture(kind) {
    const c=document.createElement('canvas');c.width=c.height=512;
    const ctx=c.getContext('2d');const im=ctx.createImageData(512,512);
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){
      let v=200+(rnd()-.5)*24;
      if(kind==='wood'||kind==='plank')v=190+Math.sin(y*.07+Math.sin(x*.008)*2)*9+Math.sin(y*.68+x*.007)*5+(rnd()-.5)*10;
      if(kind==='grass')v=180+(rnd()-.5)*22;
      if(kind==='metal')v=197+(x%128<3?-72:0)+(rnd()-.5)*8;
      const i=(y*512+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
    }
    ctx.putImageData(im,0,0);
    if(kind==='wood'){ctx.strokeStyle='#594738';ctx.lineWidth=1;for(let y=0;y<=512;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();const x=((y/64)%3)*170;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+64);ctx.stroke();}}
    if(kind==='tile'){ctx.strokeStyle='#979d96';ctx.lineWidth=2;ctx.strokeRect(0,0,512,512);}
    if(kind==='plank'){ctx.strokeStyle='#a79b89';ctx.lineWidth=3;ctx.strokeRect(0,0,512,512);}
    if(kind==='board'){ctx.strokeStyle='#9da19e';ctx.lineWidth=2;for(let y=0;y<512;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}}
    const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
  }
  const noise=texture('noise'),wood=texture('wood'),tile=texture('tile'),plank=texture('plank'),board=texture('board'),grass=texture('grass');
  plank.repeat.set(2/1.2,2/.197);tile.repeat.set(2/.6,2/.6);
  const bathMap=tile.clone();bathMap.repeat.set(2/.90,2/.45);
  const standard=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra});
  const mats={
    wall:standard('#f0efe9',{map:noise,bumpMap:noise,bumpScale:.007}),
    ceiling:standard('#f5f5f2',{roughness:.95}),
    exterior:standard('#aca79e',{map:noise,bumpMap:noise,bumpScale:.009}),
    stone:standard('#a0a29c',{map:noise,bumpMap:noise,bumpScale:.035}),
    concrete:standard('#afb2ad',{map:board,bumpMap:board,bumpScale:.013}),
    floor:standard('#bb9266',{map:plank,roughness:.57,bumpMap:plank,bumpScale:.004}),
    tile:standard('#d4c9b6',{map:tile,roughness:.79}),
    bathTile:standard('#cfc7b8',{map:bathMap,roughness:.66}),
    roof:standard('#404249',{map:noise,roughness:.50,metalness:.45}),
    fascia:standard('#aca79e',{map:noise}),
    wood:standard('#806044',{map:wood}),
    window:standard('#694c36',{map:noise,roughness:.47}),
    mara:standard('#b19473',{map:wood,roughness:.56}),
    rauli:standard('#a57858',{map:wood,roughness:.53}),
    olive:standard('#738269',{roughness:.65}),
    acacia:standard('#c0a17c',{map:wood,roughness:.61}),
    closet:standard('#cecbbf',{map:noise}),
    quartz:standard('#e3e0d7',{map:noise,roughness:.32}),
    brick:standard('#b89771',{map:tile,roughness:.96}),
    black:standard('#28312e',{roughness:.45,metalness:.45}),
    glass:new T.MeshPhysicalMaterial({color:'#e9f1ef',roughness:.06,metalness:.02,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false,envMapIntensity:.7,forceSinglePass:true}),
    ground:standard('#82956a',{map:grass,bumpMap:grass,bumpScale:.04}),
    gravel:standard('#a4aaa0',{map:noise,bumpMap:noise,bumpScale:.08}),
    soil:standard('#655d46',{map:noise}),
    linen:standard('#e3dfd4',{map:noise,roughness:.98}),
    fabric:standard('#909f94',{map:noise,roughness:.98}),
    bedding:standard('#eff0e9',{map:noise,roughness:1}),
    ceramic:new T.MeshPhysicalMaterial({color:'#fafbf5',roughness:.18,clearcoat:.6}),
    water:new T.MeshPhysicalMaterial({color:'#8cacac',roughness:.15,transparent:true,opacity:.65}),
  };
  const materialNames={wall:'Pintura interior clara - tono provisional',exterior:'Martelina fina N10 - propuesta Dorian Gray SW7017, no aprobada',fascia:'Remates exteriores - propuesta Dorian Gray SW7017',concrete:'Hormigon visto tableado - EETT 3.11',floor:'Porcelanato Arbor Canela AC 19.7x120 - EETT 4.11',tile:'Porcelanato Essen-ST Beige 60x60 - EETT 4.11',bathTile:'Porcelanato New Town Sand 45x90 - asignacion pendiente',roof:'Acero galvanizado liso 0.5 mm gris grafito',window:'PVC liso color nogal con termopanel',olive:'Melamina Verde Oliva Masisa 18 mm',acacia:'Melamina Acacia Softwood Masisa',quartz:'Cuarzo Qstone Salt Pool',mara:'Enchapado Mara clara',rauli:'Rauli macizo',closet:'MDF Lino M045'};
  for(const [key,name] of Object.entries(materialNames))mats[key].name=name;
  mats.ceiling.name='Cielo horizontal blanco a N+2.64 - G04 G05';
  grass.repeat.set(100,85);
  const originalMaterials=new Map();
  const interiorRooms=data.rooms.filter(([name,,kind])=>name!=='Estacionamiento'&&name!=='Acceso bano quincho'&&!(name.startsWith('Galeria')&&kind==='tile'));
  const interiors=interiorRooms.map(([,r])=>r);
  const roomEdges=[0,1].map(axis=>[...new Set(interiors.flatMap(r=>[r[axis],r[axis+2]]))]);
  // Split collinear edges at room boundaries without changing the G01 contours.
  function splitWallRing(ring){
    const result=[];
    for(let i=0;i<ring.length-1;i++){
      const a=ring[i],b=ring[i+1],cuts=[0];
      for(let axis=0;axis<2;axis++)if(Math.abs(b[axis]-a[axis])>.001)for(const edge of roomEdges[axis]){
        const t=(edge-a[axis])/(b[axis]-a[axis]);if(t>.00001&&t<.99999)cuts.push(t);
      }
      for(const t of [...new Set(cuts)].sort((a,b)=>a-b))result.push(a.map((v,j)=>v+(b[j]-v)*t));
    }
    result.push(ring[ring.length-1]);return result;
  }
  function finishWall(mesh){
    const geom=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;
    mesh.geometry=geom;geom.clearGroups();mesh.updateMatrix();
    const positions=geom.attributes.position,normals=geom.attributes.normal,point=new T.Vector3(),normal=new T.Vector3(),v=new T.Vector3();
    for(let i=0;i<positions.count;i+=3){
      point.set(0,0,0);for(let j=0;j<3;j++)point.add(v.fromBufferAttribute(positions,i+j));
      point.multiplyScalar(1/3).applyMatrix4(mesh.matrix);normal.fromBufferAttribute(normals,i).transformDirection(mesh.matrix);
      point.addScaledVector(normal,.12);
      const x=(point.x+24)*S+ox,z=(point.z+16)*S+oz;
      const inside=Math.abs(normal.y)>.5||interiors.some(r=>x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3]);
      const index=inside?0:1,last=geom.groups.at(-1);
      if(last?.materialIndex===index)last.count+=3;else geom.addGroup(i,3,index);
    }
    mesh.material=[mats.wall,mats.exterior];return mesh;
  }
  const boxGeo=new T.BoxGeometry(1,1,1);
  function box(group,x,y,z,w,h,d,mat,cast=true){
    if(w<=0||h<=0||d<=0)return;
    const m=new T.Mesh(boxGeo,mat);m.position.set(x,y+h/2,z);m.scale.set(w,h,d);m.castShadow=cast;m.receiveShadow=true;group.add(m);return m;
  }
  function rect(group,r,y,h,mat){
    const x0=Math.min(r[0],r[2]),z0=Math.min(r[1],r[3]),x1=Math.max(r[0],r[2]),z1=Math.max(r[1],r[3]);
    const m=box(group,X((x0+x1)/2),y,Z((z0+z1)/2),(x1-x0)/S,h,(z1-z0)/S,mat);
    if(!m)return m;
    m.geometry=new T.BoxGeometry((x1-x0)/S,h,(z1-z0)/S);m.scale.set(1,1,1);
    const p=m.geometry.attributes.position,n=m.geometry.attributes.normal,uv=m.geometry.attributes.uv;
    for(let i=0;i<p.count;i++){
      if(Math.abs(n.getY(i))>.5)uv.setXY(i,(p.getX(i)+m.position.x)/2,(p.getZ(i)+m.position.z)/2);
      else uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i)),p.getY(i));
    }
    return m;
  }
  function softBox(group,x,y,z,w,h,d,mat,r=.055){const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,5,Math.min(r,h*.4,d*.42)),mat);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
  function prism(group,poly,y,h,mat){
    const shape=new T.Shape(poly.outer.map(([x,z])=>new T.Vector2(X(x),-Z(z))));
    for(const hole of poly.holes||[])shape.holes.push(new T.Path(hole.map(([x,z])=>new T.Vector2(X(x),-Z(z)))));
    const geom=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:1});geom.rotateX(-Math.PI/2);geom.translate(0,y,0);
    const positions=geom.attributes.position,normals=geom.attributes.normal,uvs=geom.attributes.uv;
    for(let i=0;i<positions.count;i++){
      if(Math.abs(normals.getY(i))>.5)uvs.setXY(i,positions.getX(i),positions.getZ(i));
      else uvs.setXY(i,Math.abs(normals.getX(i))>.5?positions.getZ(i):positions.getX(i),positions.getY(i));
    }
    const mesh=new T.Mesh(geom,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mat===mats.wall||mat===mats.fascia?finishWall(mesh):mesh;
  }
  function segment(group,a,b,y,height,width,mat){
    const pa=pt(...a),pb=pt(...b),mid=pa.clone().add(pb).multiplyScalar(.5);
    const m=box(group,mid.x,y,mid.z,pa.distanceTo(pb),height,width,mat);
    if(m)m.rotation.y=-Math.atan2(pb.z-pa.z,pb.x-pa.x);return m&&mat===mats.wall?finishWall(m):m;
  }
  function surface(group,verts,mat){
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts.flatMap(v=>[v.x,v.y,v.z]),3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(verts.flatMap(v=>[v.x/2,v.z/2]),2));geo.setIndex([0,2,1,0,3,2]);geo.computeVertexNormals();
    const m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;group.add(m);return mat===mats.wall?finishWall(m):m;
  }
  for(const poly of data.floor)prism(structure,poly,-.22,.25,mats.stone);
  for(const [name,r,kind] of data.rooms){
    const mat=name==='Estacionamiento'?mats.gravel:name.startsWith('Bano')?(name==='Bano principal'?mats.floor:mats.bathTile):kind==='wood'?mats.floor:kind==='tile'?mats.tile:mats.stone;
    const m=rect(structure,r,.03,.017,mat);
    m.name=name;
  }
  rect(structure,[1765,1503,1910,1594],.048,.009,mats.bathTile).name='Bano visitas - acabado provisional';
  for(const wall of data.walls){
    const patioWall=Math.min(...wall.outer.map(p=>p[1]))>1774;
    const contour={outer:splitWallRing(wall.outer),holes:(wall.holes||[]).map(splitWallRing)};
    const m=prism(structure,contour,.03,2.77,patioWall?mats.concrete:mats.wall);m.name=patioWall?'Muro patio hormigon visto G01 / EETT 3.11':'Muro vectorial G01';
  }
  function opening(name,a,b,sill=0.12,head=2.64,panels=2,group=structure,upper=true,lower=true){
    const pa=pt(...a),pb=pt(...b),len=pa.distanceTo(pb),center=pa.clone().add(pb).multiplyScalar(.5),angle=-Math.atan2(pb.z-pa.z,pb.x-pa.x);
    const g=new T.Group();g.position.set(center.x,0,center.z);g.rotation.y=angle;g.name=name;group.add(g);
    const pane=new T.Mesh(new T.PlaneGeometry(len,head-sill),mats.glass);pane.position.set(0,.03+(sill+head)/2,0);g.add(pane);
    for(const y of [sill+.03,head+.005])box(g,0,y,0,len,.05,.085,mats.window);
    const divisions=Array.isArray(panels)?[0,...panels.slice(0,-1).map((_,i)=>panels.slice(0,i+1).reduce((a,b)=>a+b,0)/panels.reduce((a,b)=>a+b,0)),1]:Array.from({length:panels+1},(_,i)=>i/panels);
    for(const f of divisions)box(g,-len/2+len*f,sill+.03,0,.05,head-sill,.085,mats.window);
    if(lower&&sill>.04)segment(group,a,b,.03,sill,.13,mats.wall);
    if(upper&&head<2.77)segment(group,a,b,head+.03,2.77-head,.14,mats.wall);
    return g;
  }
  // V13 fits the G01 opening beyond the closet return; D07 gives a 2.90 m outer frame.
  const v13Center=(1209.6+1375.2)/2,v13HalfSpan=(2.90-.05)*S/2;
  const windows=[
    ['V01',[416,1378],[416,1526],.39,2.64,2],
    ['V02',[420,1378],[632,1378],.39,2.64,3],
    ['V03',[687,1378],[872,1378],.39,2.64,2],
    ['V04',[874,1378],[1073,1378],.39,2.64,3],
    ['V05',[1075,1378],[1262,1378],.39,2.64,2],
    ['V06',[310,1638.6],[310,1670],1.355,2.64,1],
    ['V07',[319.6,1784.2],[398.4,1784.2],0,2.64,1],
    ['V08',[401.6,1784.2],[551.4,1784.2],0,2.64,2],
    ['V09',[570.2,1747],[644.2,1747],.39,2.64,1],
    ['V10',[648,1804.5],[648,1844.2],1.17,2.64,1],
    ['V11',[774,1829],[872,1829],.93,2.64,2],
    ['V12',[875,1747],[1072,1747],1.30,2.64,3],
    ['V11 prima',[1073,1829],[1172,1829],.93,2.64,2],
    ['V13',[v13Center-v13HalfSpan,1864.75],[v13Center+v13HalfSpan,1864.75],.39,2.64,2],
    ['V14',[1467,1680],[1699,1680],.12,2.64,3],
    ['V15',[1705,1773],[1904,1773],.39,2.64,2],
    ['V16 PV1 V17',[1262,1611],[1631,1611],.12,2.64,5],
    ['V18 V19',[1631,1321],[1631,1611],.12,2.64,4],
    ['V20',[1360,1321],[1435,1321],.12,2.64,1],
    ['V21',[1360,791],[1360,1321],.12,2.64,5],
    ['V22',[1360,791],[1631,791],.39,2.64,3],
    ['PV2',[1631,791],[1699,791],.03,2.64,1],
    ['V23',[1883,791],[1883,970],1.22,2.64,2],
    ['PV3',[1967,995],[1967,1046],.03,2.64,1],
    ['PV4',[2042,1049],[2042,1092],.03,2.64,1],
    ['V24',[2042,1097],[2042,1160],1.10,2.52,2],
    ['V25',[1959,1244],[1991,1244],1.30,2.64,1],
    ['V26',[1910,1321],[1953,1321],1.02,2.64,1],
    ['Quincho ventana',[1414,126.72],[1558,126.72],1.0,2.64,2],
  ];
  const sills={V06:1.235,V10:1.05,V11:.81,'V11 prima':.81,V12:.90,V23:1.10,V24:1.10,V25:1.32,V26:.90,'Quincho ventana':1.0};
  const partitions={V01:1,V02:2,V03:[120,200],V04:[220,120],V05:[200,120],V09:[45,85],V11:[106,55],'V11 prima':[55,106],V12:[238.5,101],V13:[110,180],V14:[279,116.5],V15:[130,220],V21:4,V22:2,V23:[97,202],'V16 PV1 V17':[257.5,114,238.5],'V18 V19':[304,182]};
  const frosted=mats.glass.clone();frosted.roughness=.65;frosted.opacity=.63;frosted.name='Termopanel opaco de privacidad - D07 D08';
  for(const args of windows){
    args[3]=sills[args[0]]??0;args[4]=2.52;args[5]=partitions[args[0]]??args[5];const frame=opening(...args);
    frame.userData.sourceSheet=['V24','V25','V26'].includes(args[0])?'D08':'D07/D08';
    if(['V06','V10','V25'].includes(args[0]))frame.children[0].material=frosted;
  }
  opening('Ventana bano quincho - planta nueva',[1780,403.6],[1780,437.7],1.45,2.52,1);
  const interactiveDoors=[];
  for(const name of ['PV2','PV3','PV4','V16 PV1 V17']){
    const frame=structure.getObjectByName(name),args=windows.find(w=>w[0]===name),span=pt(...args[1]).distanceTo(pt(...args[2]));
    const composite=name==='V16 PV1 V17',start=composite?-span/2+span*257.5/610:-span/2,end=composite?start+span*114/610:span/2;
    const glass=frame.children[0];frame.remove(glass);glass.geometry.dispose();
    if(composite)for(const [a,b] of [[-span/2,start],[end,span/2]]){
      const pane=new T.Mesh(new T.PlaneGeometry(b-a,2.52),mats.glass);pane.position.set((a+b)/2,1.29,0);frame.add(pane);
    }
    const leaf=new T.Group(),width=end-start-.065;leaf.position.x=start+.0325;leaf.userData.dynamicDoor=true;leaf.name=`${composite?'PV1':name} hoja practicable`;frame.add(leaf);
    for(const x of [0,width])box(leaf,x,.065,0,.045,2.46,.065,mats.window);
    for(const y of [.065,2.48])box(leaf,width/2,y,0,width,.045,.065,mats.window);
    const pane=new T.Mesh(new T.PlaneGeometry(width-.045,2.39),mats.glass);pane.position.set(width/2,1.30,0);leaf.add(pane);
    box(leaf,width-.075,1.0,.052,.018,.13,.025,mats.black);
    frame.updateMatrixWorld(true);
    interactiveDoors.push({object:leaf,label:composite?'Puerta al jardin interior':`Puerta vidriada ${name}`,point:frame.localToWorld(new T.Vector3((start+end)/2,0,0)),get open(){return Math.abs(leaf.rotation.y)>1.5;},setOpen(open){leaf.rotation.y=open?-Math.PI/2:0;}});
  }
  function door(a,b,angle=.7,mat=mats.mara){
    const pa=pt(...a),pb=pt(...b),span=pa.distanceTo(pb),len=span-.04,g=new T.Group(),closed=-Math.atan2(pb.z-pa.z,pb.x-pa.x);
    g.position.copy(pa.clone().lerp(pb,.02/span));g.rotation.y=closed+angle;structure.add(g);
    const frame=new T.Group();frame.position.copy(pa);frame.rotation.y=closed;frame.name='Marco Mara y pilastras - D10';frame.userData.sourceSheet='D10';structure.add(frame);
    for(const x of [0,span]){
      box(frame,x,.03,0,.03,2.52,.09,mat);
      for(const z of [-.065,.065])box(frame,x,.03,z,.04,2.55,.02,mat);
    }
    box(frame,span/2,2.52,0,span,.03,.09,mat);
    for(const z of [-.065,.065])box(frame,span/2,2.54,z,span+.04,.04,.02,mat);
    box(g,len/2,.04,0,len,2.50,.045,mat);
    for(const side of [-1,1]){
      const escutcheon=new T.Mesh(new T.CylinderGeometry(.025,.025,.01,20),mats.stone);escutcheon.rotation.x=Math.PI/2;escutcheon.position.set(len-.09,1.04,side*.03);g.add(escutcheon);
      box(g,len-.13,1.03,side*.055,.12,.018,.018,mats.stone);
    }
    for(const y of [.22,1.27,2.30])box(g,0,y,0,.018,.08,.035,mats.stone);
    segment(structure,a,b,2.55,.25,.12,mats.wall);
    g.userData.dynamicDoor=true;
    interactiveDoors.push({object:g,label:'Puerta de paso',point:pa.clone().lerp(pb,.5),get open(){return Math.abs(g.rotation.y-closed)>1.5;},setOpen(open){g.rotation.y=closed+(open?Math.sign(angle||1)*Math.PI/2:0);}});
    return g;
  }
  const doors=[[[800,1611],[846,1611]],[[1080,1611],[1126,1611]],[[631,1680],[677,1680]],[[1178,1680],[1224,1680]],[[1378,1680],[1420,1680]],[[1731,1160],[1731,1205]],[[1699,1503],[1699,1551]],[[1699,1580],[1744,1580]],[[774,1680],[819,1680]],[[1073,1680],[1118,1680]],[[1910,1158],[1910,1195]]];
  for(const [a,b] of doors){
    if(a[0]===1699&&a[1]===1503){rect(furniture,[1697,1553,1700,1602],.05,2.48,mats.mara).name='P6 corredera consulta - D09';continue;}
    door(a,b,a[1]===1503?-.7:.7);
  }
  door([1778,491.7],[1730.6,491.7],-Math.PI/2);
  door([401.6,1619.4],[401.6,1661.9],.6);
  door([566.95,1700.4],[566.95,1747],Math.PI/2).name='P11 bano principal - abierta';
  door([1772.46,1507.12],[1772.46,1550.8],Math.PI/2).name='P7 bano visitas - abierta';
  interactiveDoors.at(-1).label='Puerta del bano de visitas';
  // D09 supplies construction; the owner confirms unequal sidelights. The 25 cm narrow pane is provisional.
  const entryX=1763.68,entryStart=1324.6,entryLimit=1496.08;
  const entryWidth=(entryLimit-entryStart)/S,outerJamb=.10,mullion=.04,narrowWidth=.25,doorOpening=1.25;
  const wideWidth=entryWidth-2*outerJamb-2*mullion-narrowWidth-doorOpening;
  const wideStart=outerJamb,wideEnd=wideStart+wideWidth,doorStart=wideEnd+mullion,doorEnd=doorStart+doorOpening;
  const narrowStart=doorEnd+mullion,narrowEnd=narrowStart+narrowWidth;
  const entryEnd=entryStart+(doorEnd-.025)*S,entryCenter=entryEnd-.60*S;
  const entryFrame=new T.Group();entryFrame.name='P1 acceso con dos ventanas asimetricas';entryFrame.position.copy(pt(entryX,entryStart));structure.add(entryFrame);
  entryFrame.userData={wideWidth,narrowWidth,width:entryWidth,leafWidth:1.20,leafHeight:2.50,provisionalAsymmetry:true};
  for(const [a,b] of [[0,wideStart],[wideEnd,doorStart],[doorEnd,narrowStart],[narrowEnd,entryWidth]]){
    box(entryFrame,0,.03,(a+b)/2,.10,2.52,b-a,mats.rauli).name='P1 marco y pilastra de rauli - D09';
  }
  box(entryFrame,0,2.54,entryWidth/2,.10,.01,entryWidth,mats.rauli).name='P1 cabezal rauli';
  const gasket=standard('#343a35',{roughness:.9});gasket.name='P1 sello perimetral termopanel';
  for(const [label,a,b] of [['amplio',wideStart,wideEnd],['angosto',narrowStart,narrowEnd]]){
    const paneGroup=new T.Group();paneGroup.name=`P1 pano fijo ${label}`;paneGroup.position.z=(a+b)/2;entryFrame.add(paneGroup);
    paneGroup.userData={role:'entrySidelight',width:b-a,glazing:'termopanel',frame:'rauli',provisionalWidth:true};
    for(const y of [.03,2.515])box(paneGroup,0,y,0,.10,.035,b-a,mats.rauli);
    for(const z of [-(b-a)/2+.0075,(b-a)/2-.0075])box(paneGroup,0,.065,z,.025,2.45,.015,gasket);
    for(const x of [-.009,.009]){
      const glass=new T.Mesh(new T.PlaneGeometry(b-a-.030,2.45),mats.glass);
      glass.rotation.y=Math.PI/2;glass.position.set(x,1.29,0);glass.name=`P1 termopanel ${label}`;paneGroup.add(glass);
    }
  }
  segment(structure,[entryX,1324.6],[entryX,1496.08],2.55,.25,.12,mats.wall);
  const entryPivot=new T.Group();entryPivot.position.copy(pt(entryX,entryEnd-.20*S));entryPivot.userData.dynamicDoor=true;structure.add(entryPivot);
  const entrance=box(entryPivot,0,.04,-.40,.045,2.50,1.20,mats.rauli);entrance.name='P1 hoja rauli 120x250 cm - pivote a 20 cm';
  const pullMaterial=standard('#20221f',{roughness:.72,metalness:.12});pullMaterial.name='P1 manillon negro mate - EETT p19';
  for(const side of [-1,1]){
    const pull=softBox(entryPivot,side*.071,.85,-.83,.025,1.0,.025,pullMaterial,.006);pull.name='P1 manillon - forma referencial';
    for(const y of [.90,1.78])box(entryPivot,side*.044,y,-.83,.055,.022,.022,pullMaterial);
    for(let i=1;i<5;i++)box(entryPivot,side*.0228,.04,-1+i*.24,.0006,2.50,.0015,gasket).name='P1 junta vertical rauli';
  }
  interactiveDoors.push({object:entryPivot,label:'Puerta principal',point:pt(entryX,entryCenter),get open(){return entryPivot.rotation.y>1.5;},setOpen(open){entryPivot.rotation.y=open?Math.PI/2:0;}});
  // P5 slides alongside the existing partition, leaving its G01 opening clear.
  const kitchenDoor=rect(structure,[1624.8,796,1624.8+.045*S,952.4],.05,2.48,mats.mara);
  kitchenDoor.name='P5 corredera comedor cocina - abierta';
  const kitchenDoorClosedZ=kitchenDoor.position.z,kitchenDoorTravel=(156.4+1.4)/S;
  function setKitchenDoorOpen(open){
    kitchenDoor.position.z=kitchenDoorClosedZ+(open?kitchenDoorTravel:0);
    kitchenDoor.userData.open=Boolean(open);
    kitchenDoor.name=`P5 corredera comedor cocina - ${open?'abierta':'cerrada'}`;
  }
  setKitchenDoorOpen(true);
  kitchenDoor.userData.dynamicDoor=true;
  interactiveDoors.push({object:kitchenDoor,label:'Puerta de cocina',point:pt(1631,874.2),get open(){return kitchenDoor.userData.open;},setOpen:setKitchenDoorOpen});
  const kitchenOverhead=new T.Group();kitchenOverhead.name='Dintel y riel superior P5';structure.add(kitchenOverhead);
  segment(kitchenOverhead,[1626,796],[1626,1110.2],2.55,.045,.04,mats.black);
  segment(kitchenOverhead,[1631,796],[1631,952.4],2.55,.25,.12,mats.wall);
  function metalDoor(name,a,b,leaves=1,transom=true){
    const pa=pt(...a),pb=pt(...b),span=pa.distanceTo(pb),frame=new T.Group();frame.position.copy(pa);frame.rotation.y=-Math.atan2(pb.z-pa.z,pb.x-pa.x);frame.name=name;frame.userData.sourceSheet='D11';structure.add(frame);
    const height=transom?2.50:2.35,totalHeight=transom?3.07:2.40;
    for(const x of [0,span])box(frame,x,.03,0,.04,totalHeight,.08,mats.black);
    for(const y of [height+.03,totalHeight])box(frame,span/2,y,0,span,.04,.08,mats.black);
    if(transom)for(let y=height+.09;y<totalHeight-.015;y+=.06){const slat=box(frame,span/2,y,0,span-.06,.014,.06,mats.black);slat.rotation.x=-.65;}
    for(let i=0;i<leaves;i++){
      const leaf=new T.Group(),right=i===1,direction=right?-1:1,w=span/leaves-.04;leaf.position.x=right?span-.02:.02;leaf.userData.dynamicDoor=true;frame.add(leaf);
      for(const x of [0,direction*w])box(leaf,x,.05,0,.035,height-.02,.045,mats.black);
      for(const y of [.05,height-.005])box(leaf,direction*w/2,y,0,w,.04,.045,mats.black);
      if(transom)for(let y=.10;y<height-.05;y+=.06){const slat=box(leaf,direction*w/2,y,0,w-.03,.014,.06,mats.black);slat.rotation.x=-.65;}
      else for(let x=.04;x<w;x+=.045)box(leaf,direction*x,.09,0,.025,height-.08,.022,mats.black);
      box(leaf,direction*(w-.09),1.03,.05,.10,.018,.025,mats.stone);
      frame.updateMatrixWorld(true);
      interactiveDoors.push({object:leaf,label:`${name}${leaves>1?` hoja ${i+1}`:''}`,point:frame.localToWorld(new T.Vector3(span*(i+.5)/leaves,0,0)),get open(){return Math.abs(leaf.rotation.y)>1.5;},setOpen(open){leaf.rotation.y=open?direction*Math.PI/2:0;}});
    }
    return frame;
  }
  for(const [i,x] of [309.6,873.6,1072.9,1907.5].entries())metalDoor(`PM1 patio ${i+1}`,[x,1897.1],[x,1942.4]);
  metalDoor('PM1 patio servicio',[2253,1049],[2253,1094.35]);
  metalDoor('PM2 nicho calefon',[1383.6,1885.2],[1453.6,1885.2],2);
  metalDoor('PM3 bodega exterior',[2725,1046],[2815.7,1046],2,false);
  // The covered galleries follow the same L-shaped route as G01.
  for(const [a,b] of [[[1262,126.72],[1262,1378]],[[310,1286],[1262,1286]],[[310,1286],[310,1611]]]){
    segment(structure,a,b,2.64,.16,.16,mats.exterior);
    const len=pt(...a).distanceTo(pt(...b)),n=Math.ceil(len/3.3);
    for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;box(structure,X(x),.03,Z(z),.075,2.61,.075,mats.black);}
  }
  // G02 aligned to G01 by grid axes: +26.82, -4.26 PDF points. V31 rough opening 65 cm.
  const skylightRect=[1821.58,1521.94,1858.42,1558.78];
  const kitchenSkylightRect=[1680.57,1073.24,1720.25,1162.81];
  const ring=r=>[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]],[r[0],r[1]]];
  const skylightHole=ring(skylightRect).reverse();
  const kitchenSkylightHole=ring(kitchenSkylightRect).reverse();
  for(const [index,sourceRoof] of data.flatRoofs.entries()){
    const poly=index===0?{...sourceRoof,holes:[...(sourceRoof.holes||[]),skylightHole,kitchenSkylightHole]}:sourceRoof;
    prism(roofs,poly,2.66,.16,mats.fascia);
    prism(roofs,poly,2.82,.035,mats.roof);
    for(const ring of [sourceRoof.outer,...sourceRoof.holes])for(let i=0;i<ring.length-1;i++)segment(roofs,ring[i],ring[i+1],2.80,.20,.095,mats.fascia);
  }
  for(const r of [[1262,554,1360,1378],[310,1286,1262,1378],[310,1378,416,1611]])rect(roofs,r,2.61,.025,mats.wood);
  // G04 A-D: the bedroom roof rises over an attic, not over open interiors.
  for(const [name,r] of interiorRooms){
    if(name==='Living comedor'||name==='Quincho')continue;
    const holes=[skylightRect,kitchenSkylightRect].filter(s=>r[0]<s[0]&&r[1]<s[1]&&r[2]>s[2]&&r[3]>s[3]).map(s=>ring(s).reverse());
    const ceiling=holes.length?prism(ceilings,{outer:ring(r),holes},data.dimensions.ceiling,.01,mats.ceiling):rect(ceilings,r,data.dimensions.ceiling,.01,mats.ceiling);
    ceiling.name=`Cielo cerrado - ${name}`;
  }
  const guestSkylight=new T.Group();guestSkylight.name='V31 lucarna bano visitas';roofs.add(guestSkylight);
  const [sx0,sz0,sx1,sz1]=skylightRect,lining=.025*S;
  const shaftInner=[sx0+lining,sz0+lining,sx1-lining,sz1-lining];
  prism(guestSkylight,{outer:ring(skylightRect),holes:[ring(shaftInner).reverse()]},2.64,.365,mats.ceiling).name='V31 ducto de luz abierto';
  const flashing=.08*S;
  prism(guestSkylight,{outer:ring([sx0-flashing,sz0-flashing,sx1+flashing,sz1+flashing]),holes:[skylightHole]},2.857,.018,mats.roof).name='V31 tapajuntas';
  const glassRect=[sx0+2*lining,sz0+2*lining,sx1-2*lining,sz1-2*lining];
  prism(guestSkylight,{outer:ring(shaftInner),holes:[ring(glassRect).reverse()]},3.005,.045,mats.black).name='V31 marco 60x60 cm';
  const skylightGlass=rect(guestSkylight,glassRect,3.025,.008,mats.glass);skylightGlass.castShadow=false;skylightGlass.name='V31 vidrio lucarna';
  const kitchenSkylight=new T.Group();kitchenSkylight.name='V30 lucarna cocina 70 x 158';kitchenSkylight.userData={sourceSheet:'D08/G02',size:[.70,1.58],curbHeightProvisional:true};roofs.add(kitchenSkylight);
  const [kx0,kz0,kx1,kz1]=kitchenSkylightRect,ki=[kx0+lining,kz0+lining,kx1-lining,kz1-lining];
  prism(kitchenSkylight,{outer:ring(kitchenSkylightRect),holes:[ring(ki).reverse()]},2.64,.365,mats.ceiling).name='V30 ducto continuo';
  prism(kitchenSkylight,{outer:ring([kx0-flashing,kz0-flashing,kx1+flashing,kz1+flashing]),holes:[kitchenSkylightHole]},2.857,.018,mats.roof);
  const kg=[ki[0]+lining,ki[1]+lining,ki[2]-lining,ki[3]-lining];
  prism(kitchenSkylight,{outer:ring(ki),holes:[ring(kg).reverse()]},3.005,.045,mats.window);
  rect(kitchenSkylight,kg,3.025,.008,mats.glass).castShadow=false;
  for(const r of data.highRoofs){
    const [x0,z0,x1,z1]=r.rect;
    const corners=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
    const height=(x,z)=>r.low+(r.high-r.low)*(r.axis==='x'?(x-x0)/(x1-x0):(z-z0)/(z1-z0));
    const verts=corners.map(([x,z])=>pt(x,z,height(x,z)));
    const mat=mats.roof.clone();mat.side=T.DoubleSide;surface(roofs,verts,mat);
    if(r.name==='Cubierta living comedor'||r.name==='Cubierta quincho'){
      const soffit=mats.wood.clone();soffit.side=T.DoubleSide;
      surface(roofs,verts.map(v=>v.clone().add(new T.Vector3(0,-.16,0))),soffit).name=`Cielo alto visto - ${r.name}`;
    }
    for(let i=0;i<4;i++){
      const a=verts[i],b=verts[(i+1)%4];surface(roofs,[a,b,b.clone().add(new T.Vector3(0,-.16,0)),a.clone().add(new T.Vector3(0,-.16,0))],mats.black.clone());
    }
    const n=Math.floor((r.axis==='x'?(z1-z0):(x1-x0))/S/.52);
    for(let i=0;i<=n;i++){
      const f=i/n;
      const a=r.axis==='x'?[x0,z0+(z1-z0)*f]:[x0+(x1-x0)*f,z0];
      const b=r.axis==='x'?[x1,a[1]]:[a[0],z1];
      const va=pt(...a,height(...a)+.01),vb=pt(...b,height(...b)+.01),d=vb.clone().sub(va);
      const m=new T.Mesh(new T.CylinderGeometry(.009,.009,d.length(),4),mats.black);m.position.copy(va).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());roofs.add(m);
    }
    const ends=r.axis==='x'?[[[x0+14,z0+14],[x1-27,z0+14]],[[x1-27,z1-14],[x0+14,z1-14]]]:[[[x0+7,z0+7],[x0+7,z1-7]],[[x1-7,z1-7],[x1-7,z0+7]]];
    for(const [a,b] of ends){
      const face=[pt(...a,2.79),pt(...b,2.79),pt(...b,height(...b)-.16),pt(...a,height(...a)-.16)];
      surface(roofs,face,mats.wall);surface(roofs,[...face].reverse(),mats.wall);
    }
    if(r.name.includes('living')){
      const a=[1631,791],b=[1631,1321];segment(roofs,a,b,2.80,.35,.13,mats.wall);
      const span=(b[1]-a[1])/S,pane=(span-.8)/9;
      for(let i=0;i<9;i++){
        const z0=a[1]+i*(pane+.1)*S,z1=z0+pane*S;
        opening(i===0?'V27':i===8?'V29':`V28-${i}`,[1631,z0],[1631,z1],3.15,3.95,1,roofs,false,false);
        if(i<8)segment(roofs,[1631,z1],[1631,z1+.1*S],3.15,.80,.13,mats.wall);
      }
      segment(roofs,a,b,3.95,.29,.13,mats.wood);
    } else if(r.axis==='x')segment(roofs,[1631,z0+14],[1631,z1-14],2.80,1.52,.13,mats.wood);
    else {
      segment(roofs,[x0+7,1674],[x1-7,1674],2.80,1.55,.13,mats.wood);
      for(let x=x0+7;x<x1-7;x+=7)box(roofs,X(x),2.81,Z(1678),.045,1.51,.045,mats.black);
    }
  }
  // Chimney: +5.12 m in the elevation sheets.
  rect(roofs,[1628,395,1689,493],2.80,2.255,mats.concrete);
  rect(roofs,[1624,391,1694,497],5.055,.065,mats.black);
  for(let y=.16;y<5.12;y+=.19)segment(roofs,[1627,397],[1627,491],y,.009,.008,mats.black);
  // Furniture follows the positions shown in the furnished floor plan.
  function local(x,z,rotation=0){const g=new T.Group();g.position.copy(pt(x,z,.055));g.rotation.y=rotation;g.userData.planPosition=[x,z];furniture.add(g);return g;}
  function leg(g,x,z,height,mat=mats.wood){
    const m=new T.Mesh(new T.CylinderGeometry(.035,.023,height,12),mat);m.position.set(x,height/2,z);m.castShadow=true;g.add(m);
  }
  function seam(g,w,d,y,z,mat=mats.linen){
    const r=.055,pts=[];
    for(const [cx,cz,start] of [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI/2],[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5]])
      for(let i=0;i<=6;i++){const a=start+i*Math.PI/12;pts.push(new T.Vector3(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r+z));}
    pts.push(pts[0].clone());const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),64,.003,4,false),mat);g.add(m);
  }
  function pillow(g,x,y,z,w=.48,d=.17,rotation=0){
    const p=softBox(g,x,y,z,w,.42,d,mats.linen,.095);p.rotation.set(-.18,rotation,.10);
    const pos=p.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const xx=pos.getX(i),yy=pos.getY(i);pos.setZ(i,pos.getZ(i)+.006*Math.sin(xx*72+yy*28)*Math.pow(Math.abs(xx)/(w/2),3));}
    // Keep the analytic rounded-box normals smooth across duplicated seam vertices.
    return p;
  }
  function nightstand(g,x,z,width=.42){
    softBox(g,x,.03,z,width,.43,.40,mats.wood,.025).name='Velador';
    box(g,x,.25,z+.206,width-.13,.012,.015,mats.black);
  }
  function bed(x,z,w=1.6,d=2,rotation=0,bedsideSides=[-1,1]){
    const g=local(x,z,rotation);g.name='Cama tapizada con ropa de cama';g.userData.kind='bed';g.userData.dimensions=[w,d];softBox(g,0,.08,0,w+.08,.20,d+.09,mats.fabric);softBox(g,0,.28,0,w,.23,d,mats.bedding,.09);softBox(g,0,.03,-d/2,.1+w,1.08,.14,mats.fabric,.07);
    for(const px of w>1.2?[-w/4,w/4]:[0]){const p=softBox(g,px,.52,-d/2+.29,w>.9?.65:.55,.13,.43,mats.bedding,.1);p.rotation.z=px*.06;}
    const duvet=new T.PlaneGeometry(w+.22,d-.23,48,48);duvet.rotateX(-Math.PI/2);
    const positions=duvet.attributes.position;
    for(let i=0;i<positions.count;i++){const xx=positions.getX(i),zz=positions.getZ(i);const drop=Math.max(0,Math.abs(xx)-w/2+.04)*2.2+Math.max(0,zz-(d-.23)/2+.13)*.7;positions.setY(i,.55-drop+.012*Math.sin(xx*28+zz*8)+.014*Math.sin(zz*19+xx*4));}
    duvet.computeVertexNormals();const cover=new T.Mesh(duvet,mats.bedding);cover.position.z=.23;cover.castShadow=true;cover.receiveShadow=true;g.add(cover);
    softBox(g,0,.565,.68,w+.08,.025,.42,mats.fabric,.01);
    for(const side of bedsideSides)nightstand(g,side*(w/2+.29),-d/2+.1);
    return g;
  }
  // G01 inner wall face x=680.8; the decorated headboard projects 1.11 m from the bed center.
  const masterBed=bed(680.8-(1.11+.008)*S,1490,1.8,2.0,-Math.PI/2);
  masterBed.userData.room='Dormitorio principal';
  for(const [room,wallX,side] of [['Dormitorio 1',687.3,1],['Dormitorio 2',1259.3,-1]]){
    const rotation=side*Math.PI/2;
    for(const z of [1423,1513])bed(wallX+side*1.078*S,z,.95,2,rotation,[]).userData.room=room;
    const shared=local(wallX+side*.208*S,1468,rotation);
    shared.name='Velador compartido entre camas';shared.userData.room=room;
    nightstand(shared,0,0,.40);
  }
  bed(1300,1780,1.6,2,-Math.PI/2);bed(1830,1280,1.05,2,-Math.PI/2);
  function sofa(x,z,w=2.65,rot=0){
    const g=local(x,z,rot);g.name='Sofa contemporaneo tapizado';g.userData.kind='sofa';g.userData.width=w;
    for(const a of [-w/2+.16,w/2-.16])for(const b of [-.32,.32])leg(g,a,b,.16,mats.black);
    softBox(g,0,.13,0,w,.20,.96,mats.fabric,.07);softBox(g,0,.32,-.37,w,.48,.23,mats.fabric,.075);
    for(const s of [-1,1])softBox(g,s*(w/2-.10),.25,0,.22,.40,.95,mats.fabric,.085);
    const cw=(w-.46)/3;
    for(let i=0;i<3;i++){const cg=new T.Group();cg.position.x=(i-1)*cw;g.add(cg);softBox(cg,0,.34,.08,cw-.012,.16,.67,mats.fabric,.055);seam(cg,cw-.026,.65,.45,.08,mats.fabric);const cushion=softBox(cg,0,.48,-.23,cw-.018,.35,.22,mats.fabric,.07);cushion.rotation.x=-.17;}
    pillow(g,-w/2+.42,.44,-.04,.43,.18,-.2);pillow(g,w/2-.41,.44,-.04,.43,.18,.2);
    return g;
  }
  sofa(1493,995,2.4,0);sofa(1590,1104,2.5,-Math.PI/2);sofa(1035,1498,3.3,-Math.PI/2);sofa(1510,350,2.1,0);sofa(1510,528,2.1,Math.PI);
  function chair(x,z,rot=0,soft=false){const g=local(x,z,rot),mat=soft?mats.fabric:mats.wood;g.userData.asset=soft?'modern_arm_chair_01':'dining_chair_02';g.name=soft?'Butaca de madera y cuero':'Silla de comedor tapizada';box(g,0,.39,0,.46,.10,.48,mat);box(g,0,.45,-.21,.46,.36,.055,mat);for(const a of [-.18,.18])for(const b of [-.18,.18])box(g,a,.025,b,.035,.37,.035,mats.black);return g;}
  function table(x,z,w,d,height=.75){const g=local(x,z);g.name='Mesa de roble con cantos redondeados';g.userData.kind='table';g.userData.dimensions=[w,d,height];softBox(g,0,height-.045,0,w,.045,d,mats.wood,.018);for(const a of [-w/2+.18,w/2-.18])for(const b of [-d/2+.14,d/2-.14])leg(g,a,b,height-.045);return g;}
  table(1505,880,2.35,1.2);for(let i=0;i<4;i++){chair(1440+i*40,834,0);chair(1440+i*40,930,Math.PI);}chair(1424,880,Math.PI/2);chair(1590,880,-Math.PI/2);
  table(1388,237,3.0,.95);for(const z of [191,283]){const g=local(1388,z);box(g,0,.42,0,3.0,.055,.35,mats.wood);for(const x of [-1.25,1.25])box(g,x,.03,0,.07,.39,.30,mats.black);}
  chair(1398,414,Math.PI/2,true);chair(1398,468,Math.PI/2,true);table(1508,442,1.5,.90,.42);
  chair(1452,1208,.3,true);chair(1560,1208,-.3,true);
  table(1450,1120,1.2,.65,.34);table(1530,1110,.58,.58,.43);
  function counter(r,height=.977,base=mats.olive,top=mats.quartz){
    rect(furniture,r,.16,.018,base);
    for(const x of [r[0],r[2]-1])rect(furniture,[x,r[1],x+1,r[3]],.16,height-.20,base);
    for(const z of [r[1],r[3]-1])rect(furniture,[r[0],z,r[2],z+1],.16,height-.20,base);
    rect(furniture,[r[0]-1,r[1]-1,r[2]+1,r[3]+1],height-.04,.04,top);
  }
  counter([1839,799,1876,899]);counter([1839,952,1876,985]);counter([1695,753,1876,791]);counter([1757.82,847.29,1820.18,992.71]);rect(furniture,[1775,861,1806,916],.979,.015,mats.black).name='Encimera gas cinco quemadores - D05';
  for(const p of [[1783,870],[1798,870],[1783,891],[1798,891],[1790.5,907]]){const m=new T.Mesh(new T.TorusGeometry(.08,.007,6,24),mats.stone);m.name='Quemador cocina';m.rotation.x=Math.PI/2;m.position.copy(pt(...p,1.005));furniture.add(m);}
  rect(furniture,[1700,753,1736,791],.03,2.585,mats.olive);rect(furniture,[1743,760,1788,790],.03,2.05,mats.stone);
  counter([1620,155,1674,215],.947,mats.concrete,mats.concrete);rect(furniture,[1620,406,1669,481],.58,.16,mats.black);
  rect(furniture,[1620,406,1669,481],.047,.08,mats.concrete);
  for(const z of [406,478])rect(furniture,[1620,z,1669,z+3],.127,.453,mats.concrete);
  rect(furniture,[1620,216,1674,326],.16,.05,mats.concrete);
  for(const z of [216,324])rect(furniture,[1620,z,1674,z+2],.16,.57,mats.concrete);
  counter([1522,211,1579,309],1.197,mats.concrete,mats.concrete);
  function cabinetFace(a,b,y,height,material=mats.olive,glazed=false){
    const pa=pt(...a),pb=pt(...b),length=pa.distanceTo(pb),n=Math.max(1,Math.round(length/.53)),g=new T.Group();g.position.copy(pa.clone().add(pb).multiplyScalar(.5));g.rotation.y=-Math.atan2(pb.z-pa.z,pb.x-pa.x);furniture.add(g);
    for(let i=0;i<n;i++){
      const w=length/n-.012,x=-length/2+(i+.5)*length/n;
      box(g,x,y,0,w,height,.02,glazed?mats.glass:material);
      for(const dx of [-w/2+.025,w/2-.025])box(g,x+dx,y,.018,.05,height,.024,material);
      for(const dy of [0,height-.055])box(g,x,y+dy,.018,w,.055,.024,material);
      box(g,x+w/2-.11,y+height*.52,.05,.025,.10,.027,mats.black);
    }
  }
  cabinetFace([1837,800],[1837,985],.177,.756);
  cabinetFace([1756,848],[1756,992],.177,.756,mats.acacia);
  cabinetFace([1822,992],[1822,848],.177,.756);
  cabinetFace([1700,793],[1736,793],.14,.57);
  cabinetFace([1695,793],[1876,793],1.985,.63);
  rect(furniture,[1640,980,1641,1128],1.665,.93,mats.acacia);
  for(const y of [1.665,1.975,2.285,2.58])rect(furniture,[1640,980,1660,1128],y,.018,mats.acacia);
  for(const z of [980,1127])rect(furniture,[1640,z,1660,z+1],1.665,.93,mats.acacia);
  cabinetFace([1790,785],[1875,785],1.665,.92,mats.olive,true);
  cabinetFace([1662,1128],[1662,980],1.665,.92,mats.olive,true);
  for(const [y,h] of [[.78,.59],[1.43,.43]]){rect(furniture,[1703,791,1733,794],y,h,mats.black);segment(furniture,[1707,795],[1729,795],y+h-.06,.025,.025,mats.stone);}
  rect(furniture,[1752,786,1786,791],.14,1.76,mats.stone);
  segment(furniture,[1768,792],[1768,792.4],.82,.48,.025,mats.black);
  const hood=rect(furniture,[1763,860,1814,886],1.65,.11,mats.stone);hood.name='Campana isla 90 cm - EETT 5.9';
  rect(furniture,[1782,863,1796,880],1.76,.86,mats.stone);
  rect(furniture,[1665,155,1670,385],.88,.78,mats.brick);
  rect(furniture,[1616,155,1620,385],1.72,.93,mats.black).name='Frente aereo de acero quincho - D12';
  for(let z=412;z<480;z+=5)segment(furniture,[1620,z],[1660,z],.755,.012,.012,mats.stone);
  function bath(x,z,rot=0){
    const g=local(x,z,rot);g.name='WC ceramico';
    const profile=[[.09,0],[.105,.05],[.10,.20],[.16,.29],[.20,.35],[.21,.39]].map(p=>new T.Vector2(...p));
    const bowl=new T.Mesh(new T.LatheGeometry(profile,40),mats.ceramic);bowl.scale.z=1.35;bowl.castShadow=true;bowl.receiveShadow=true;g.add(bowl);
    const inner=new T.Mesh(new T.SphereGeometry(.17,32,16),mats.ceramic);inner.scale.set(1,.23,1.37);inner.position.set(0,.361,0);g.add(inner);
    const seat=new T.Mesh(new T.TorusGeometry(.174,.025,12,48),mats.ceramic);seat.rotation.x=Math.PI/2;seat.scale.y=1.38;seat.position.y=.412;g.add(seat);
    softBox(g,0,.31,-.255,.36,.40,.16,mats.ceramic,.035);softBox(g,0,.70,-.255,.38,.025,.18,mats.ceramic,.009);
    const button=new T.Mesh(new T.CylinderGeometry(.022,.022,.004,20),mats.stone);button.position.set(.06,.73,-.255);g.add(button);
  }
  bath(334,1640,Math.PI/2);bath(798,1752,Math.PI/2);bath(1148,1752,-Math.PI/2);bath(1967,1220,Math.PI);bath(1837,1569,Math.PI);bath(1714,426,0);
  counter([1741,408,1771,434],.84,mats.acacia,mats.quartz);
  rect(furniture,[1747,413,1765,429],.86,.05,mats.ceramic);
  rect(furniture,[1695,405,1696,480],.03,1.20,mats.bathTile);
  const masterBathroom=buildMasterBathroom({furniture,mats,pt,data});
  const constructionDetails=buildConstructionDetails({furniture,mats,pt,data});
  table(1820,1690,1.9,.65,.74).name='Escritorio consulta';
  chair(1737,1690,Math.PI/2,true).name='Silla consulta';
  // Gravel and garden beds stay inside the courtyards from G01.
  box(site,0,-.34,0,500,.1,500,mats.ground,false);
  rect(site,[1883,751,3170,1370],-.10,.10,mats.gravel);
  rect(site,[1699,1321,2010,1503],-.08,.10,mats.tile);
  rect(site,[1870,1720,2200,2110],-.12,.07,mats.gravel);
  for(const [name,r] of data.gardens){rect(site,r,-.065,.08,mats.soil);const border=[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]],[r[0],r[1]]];for(let i=0;i<4;i++)segment(site,border[i],border[i+1],-.035,.09,.09,mats.stone);}
  rect(site,data.masterBathroom.gardenStrip,-.065,.08,mats.soil);
  for(let i=0;i<8;i++)rect(site,[1620+i*8,565+i*27,1690+i*8,579+i*27],.018,.04,mats.tile);
  for(let i=0;i<9;i++)rect(site,[1938+i*25,1903-i*18,1953+i*25,1780-i*18],-.025,.06,mats.tile);
  // Leaf alpha texture gives the planting a natural silhouette in shadows.
  const lc=document.createElement('canvas');lc.width=lc.height=64;const lctx=lc.getContext('2d');lctx.fillStyle='#b7c48d';lctx.beginPath();lctx.moveTo(32,2);lctx.bezierCurveTo(60,24,62,45,32,62);lctx.bezierCurveTo(2,45,4,24,32,2);lctx.fill();lctx.strokeStyle='#829459';lctx.lineWidth=1;lctx.beginPath();lctx.moveTo(32,4);lctx.lineTo(32,61);lctx.stroke();
  const lt=new T.CanvasTexture(lc);lt.colorSpace=T.SRGBColorSpace;
  const leafMat=new T.MeshStandardMaterial({map:lt,color:'#c8cfba',side:T.DoubleSide,alphaTest:.5,roughness:.96});
  const bark=standard('#716451',{map:noise});
  function branch(group,a,b,r1,r2){const d=b.clone().sub(a);const m=new T.Mesh(new T.CylinderGeometry(r2,r1,d.length(),7),bark);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.castShadow=true;group.add(m);}
  function tree(px,pz,height=4.5,radius=1.9,small=false){
    const g=new T.Group();g.position.copy(pt(px,pz,.04));plants.add(g);
    branch(g,new T.Vector3(),new T.Vector3(.12,height*.62,.08),small?.035:.11,small?.018:.065);
    const centers=[];
    for(let i=0;i<7;i++){const a=i*2.3999;const c=new T.Vector3(Math.cos(a)*radius*.52,height*(.59+rnd()*.22),Math.sin(a)*radius*.52);branch(g,new T.Vector3(.05,height*.37,0),c,small?.018:.045,.012);centers.push(c);}
    const count=small?150:1800,leaves=new T.InstancedMesh(new T.PlaneGeometry(small?.12:.22,small?.21:.34),leafMat,count),dummy=new T.Object3D(),color=new T.Color();
    for(let i=0;i<count;i++){const c=centers[i%centers.length],a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*radius*.63;dummy.position.set(c.x+Math.cos(a)*r,c.y+(rnd()-.5)*radius*.92,c.z+Math.sin(a)*r);dummy.rotation.set(rnd()*Math.PI,rnd()*Math.PI*2,rnd()*Math.PI);dummy.scale.setScalar(.7+rnd()*.7);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);color.setHSL(.22+rnd()*.055,.22+rnd()*.15,.36+rnd()*.20);leaves.setColorAt(i,color);}
    leaves.castShadow=!small;leaves.receiveShadow=true;g.add(leaves);
  }
  for(const [name,r,center] of data.gardens){
    if(center)tree(...center,name==='Patio central'?4.9:3.9,name==='Patio central'?1.9:1.4);
    const perimeter=[[r[0]+30,r[1]+30],[r[2]-30,r[1]+30],[r[2]-30,r[3]-30],[r[0]+30,r[3]-30]];
    for(let i=0;i<4;i++){const a=perimeter[i],b=perimeter[(i+1)%4],n=Math.floor(pt(...a).distanceTo(pt(...b))/.75);for(let j=0;j<n;j++)tree(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,.50+rnd()*.25,.32,true);}
  }
  for(let i=0;i<3;i++)for(let j=0;j<5;j++)tree(2100+j*245,210+i*240,3.8+rnd(),1.7);
  tree(238,1420,5.5,2.1);tree(2070,872,4.6,2.0);tree(3020,1410,4.4,2.0);
  for(let x=1880;x<2250;x+=50)tree(x,1355,.8,.40,true);
  // Open-sided parking, three bays shown in plan.
  for(const x of [2253,2487,2721])for(const z of [1046,1321])box(structure,X(x),.03,Z(z),.10,2.60,.10,mats.black);
  for(const x of [2332,2487,2640]){
    const g=local(x,1187);box(g,0,.24,0,1.76,.50,4.10,standard('#bdc6bd',{metalness:.65,roughness:.28}));box(g,0,.72,-.12,1.55,.53,2.1,mats.black);box(g,0,1.25,-.13,1.58,.09,2.16,mats.stone);
    for(const xx of [-.87,.87])for(const zz of [-1.26,1.26]){const wheel=new T.Mesh(new T.CylinderGeometry(.31,.31,.16,20),mats.black);wheel.rotation.z=Math.PI/2;wheel.position.set(xx,.3,zz);g.add(wheel);}
  }
  function registerMaterials(){root.traverse(o=>{if(o.isMesh&&!originalMaterials.has(o))originalMaterials.set(o,o.material);});}
  registerMaterials();
  const clay=new T.MeshStandardMaterial({color:'#eeeeda',roughness:.82});
  function setMaterial(mode){structure.traverse(o=>{if(o.isMesh&&originalMaterials.get(o)!==mats.glass)o.material=mode==='white'?clay:originalMaterials.get(o);});roofs.traverse(o=>{if(o.isMesh)o.material=mode==='white'?clay:originalMaterials.get(o);});}
  return {root,structure,roofs,ceilings,furniture,plants,site,mats,setMaterial,setKitchenDoorOpen,kitchenDoor,kitchenOverhead,interactiveDoors,masterBathroom,constructionDetails,pt,windows,data,registerMaterials};
}
