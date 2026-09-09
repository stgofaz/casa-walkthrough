import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Loose furnishings only: the plan, fixed finishes and door geometry remain authoritative.
export function addDecoration(house,art={}){
  const root=new T.Group();root.name='Decoracion segun referencias septiembre 2026';house.furniture.add(root);
  const lampPoints=[],emissiveMaterials=[],m=house.mats;
  const material=(base,color)=>{const mat=base.clone();mat.color.set(color);return mat;};
  const oak=material(m.wood,'#aa9275'),aged=material(m.wood,'#807768'),ivory=material(m.wall,'#dfded4');
  ivory.normalScale.set(.04,.04);
  const linen=material(m.fabric,'#a19b8e'),wool=material(m.linen,'#e6e4d9');wool.normalScale.set(.65,.65);
  const black=new T.MeshStandardMaterial({color:'#282823',roughness:.65});
  const brass=new T.MeshStandardMaterial({color:'#9b8e70',metalness:.8,roughness:.4});
  const red=material(m.wood,'#792f39');red.map=null;red.roughnessMap=null;red.normalScale.set(.06,.06);red.roughness=.69;
  const silver=new T.MeshStandardMaterial({color:'#aca99e',metalness:.78,roughness:.43,normalMap:m.exterior.normalMap,normalScale:new T.Vector2(.2,.2)});
  const leather=new T.MeshStandardMaterial({color:'#65483a',roughness:.45,normalMap:m.fabric.normalMap,normalScale:new T.Vector2(.09,.09)});
  const glass=new T.MeshPhysicalMaterial({color:'#dbe8df',transparent:true,opacity:.22,roughness:.07,metalness:.12,envMapIntensity:1.4,depthWrite:false,side:T.DoubleSide});
  const ceramic=new T.MeshStandardMaterial({color:'#3e4942',roughness:.42});
  function texture(draw){const c=document.createElement('canvas');c.width=c.height=512;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
  const stripe=texture(c=>{
    c.fillStyle='#dfdbcf';c.fillRect(0,0,512,512);
    for(const [y,h] of [[135,110],[110,9],[260,9]]){c.fillStyle='#383832';c.fillRect(0,y,512,h);}
    for(let y=0;y<512;y+=3){c.strokeStyle=y%2?'#ffffff19':'#00000015';c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
    for(let x=0;x<512;x+=3){c.fillStyle='#ffffff12';c.fillRect(x,0,1,512);}
  });
  const striped=material(m.linen,'#ffffff');striped.map=stripe;
  const weave=texture(c=>{
    c.fillStyle='#aca18b';c.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=8)for(let x=0;x<512;x+=8){c.fillStyle=(x/8+y/8)%2?'#d0c5af':'#847c6d';c.fillRect(x,y,7,3);c.fillStyle='#d6cdbb';c.fillRect(x+2,y+3,3,5);}
  });weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(3,3);
  const woven=new T.MeshStandardMaterial({map:weave,color:'#ffffff',roughness:1,bumpMap:weave,bumpScale:.009});
  const knitMap=texture(c=>{
    c.fillStyle='#b9b6a9';c.fillRect(0,0,512,512);c.lineWidth=5;c.lineCap='round';
    for(let y=-16;y<530;y+=16)for(let x=0;x<512;x+=16){c.strokeStyle='#e9e6d7';c.beginPath();c.moveTo(x+2,y);c.quadraticCurveTo(x+3,y+8,x+8,y+12);c.quadraticCurveTo(x+13,y+7,x+14,y);c.stroke();}
  });knitMap.wrapS=knitMap.wrapT=T.RepeatWrapping;knitMap.repeat.set(2,1);
  const knit=new T.MeshStandardMaterial({map:knitMap,bumpMap:knitMap,bumpScale:.012,roughness:1,side:T.DoubleSide});
  function mesh(g,geo,mat,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(g,x,y,z,w,h,d,mat,r=.018){return mesh(g,new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.2,h*.4,d*.4)),mat,x,y,z);}
  function cylinder(g,x,y,z,rt,rb,h,mat){return mesh(g,new T.CylinderGeometry(rt,rb,h,24),mat,x,y,z);}
  function tube(g,points,r,mat){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false),mat);}
  function place(name,x,z,rotation=0){const g=new T.Group();g.name=name;g.position.copy(house.pt(x,z,.055));g.rotation.y=rotation;g.userData.planPosition=[x,z];g.userData.decoration=true;root.add(g);return g;}
  function cushion(g,x,y,z,w=.45,h=.30){const p=box(g,x,y,z,w,h,.15,striped,.075);p.rotation.x=-.18;return p;}
  function plant(g,x,y,z,size=.7){
    const p=new T.Group();p.position.set(x,y,z);p.scale.setScalar(size);g.add(p);
    mesh(p,new T.LatheGeometry([[.13,0],[.18,.03],[.20,.28],[.19,.31]].map(a=>new T.Vector2(...a)),24),ceramic);
    cylinder(p,0,.29,0,.177,.177,.01,black);
    const leafMat=new T.MeshStandardMaterial({color:'#476244',roughness:.78,side:T.DoubleSide});
    for(let i=0;i<9;i++){
      const angle=i*2.4,h=.65+(i%3)*.17,dx=Math.cos(angle)*.26,dz=Math.sin(angle)*.26;
      tube(p,[[0,.28,0],[dx*.3,h*.7,dz*.3],[dx,h,dz]],.008,leafMat);
      const leaf=new T.PlaneGeometry(.24,.45,8,12),pos=leaf.attributes.position;
      for(let j=0;j<pos.count;j++){const yy=pos.getY(j),xx=pos.getX(j);pos.setX(j,xx*Math.max(.03,Math.sin((yy/.45+.5)*Math.PI)));pos.setZ(j,.055*Math.cos(yy*5)-Math.abs(xx)*.35);}
      leaf.computeVertexNormals();const l=mesh(p,leaf,leafMat,dx,h+.09,dz);l.rotation.set(-.65,angle,Math.sin(angle)*.4);
    }return p;
  }
  function lamp(g,x,y,z,height=1.50,wicker=true){
    cylinder(g,x,y+.025,z,.16,.18,.05,black);cylinder(g,x,y+height/2,z,.011,.011,height,brass);
    const shadeMat=(wicker?woven:wool).clone();shadeMat.side=T.DoubleSide;shadeMat.emissive=new T.Color('#ffcc90');shadeMat.emissiveIntensity=.22;emissiveMaterials.push(shadeMat);
    const shade=mesh(g,new T.CylinderGeometry(height>.8?.19:.14,height>.8?.25:.18,.32,48,1,true),shadeMat,x,y+height,z);shade.name='Pantalla de fibra natural';
    const bulbMat=new T.MeshStandardMaterial({color:'#fff2d1',emissive:'#ffd293',emissiveIntensity:2});emissiveMaterials.push(bulbMat);
    mesh(g,new T.SphereGeometry(.038,12,8),bulbMat,x,y+height-.08,z);
    g.updateWorldMatrix(true,false);lampPoints.push(g.localToWorld(new T.Vector3(x,y+height-.19,z)));
  }
  function books(g,x,y,z){
    for(let i=0;i<2;i++){const mat=new T.MeshStandardMaterial({color:['#354b4b','#b0a694'][i],roughness:.85});const b=box(g,x,y+i*.035,z,.24,.03,.30,mat,.003);b.rotation.y=.08*i;}
  }
  function frame(name,x,z,y,w,h,key,rotation=0,wide=true){
    const g=place(name,x,z,rotation);g.position.y=y;
    const mat=new T.MeshStandardMaterial({map:art[key]??null,color:'#ffffff',roughness:.88});
    box(g,0,0,-.014,w,h,.025,ivory,.003);
    const border=wide?.12:.035,matting=wide?.07:.025,aw=w-2*(border+matting),ah=h-2*(border+matting);
    const panel=mesh(g,new T.PlaneGeometry(aw,ah),mat,0,0,.005);panel.name=`Obra original ${key}`;
    for(const [inset,b,depth] of [[0,border,.06],[border-.02,.016,.075],[.01,.008,.078]]){
      const fw=w-inset*2,fh=h-inset*2;
      for(const sign of [-1,1]){box(g,sign*(fw-b)/2,0,depth/2, b,fh,depth,silver,.004);box(g,0,sign*(fh-b)/2,depth/2,fw-b*2,b,depth,silver,.004);}
    }
    g.userData.wallMounted=true;return g;
  }
  function rug(x,z,w,d){const g=place('Alfombra tejida natural',x,z);const mat=woven.clone();mat.map=weave.clone();mat.map.repeat.set(w*2,d*2);box(g,0,.004,0,w,.008,d,mat,.002);
    const n=Math.round(w/.025),fringe=new T.InstancedMesh(new T.CylinderGeometry(.0015,.0015,.035,5),wool,n*2),dummy=new T.Object3D();
    for(let side=0;side<2;side++)for(let i=0;i<n;i++){dummy.position.set(-w/2+i*.025,.002,(side?1:-1)*(d/2+.016));dummy.rotation.x=Math.PI/2;dummy.updateMatrix();fringe.setMatrixAt(side*n+i,dummy.matrix);}g.add(fringe);
    return g;
  }
  const originals=[...house.furniture.children];
  for(const g of originals){
    const [x,z]=g.userData.planPosition??[];
    if(g.userData.kind==='sofa'){
      const upholstered=material(linen,z<600?'#969d91':'#a7a194');
      g.traverse(o=>{if(o.isMesh&&o.material===m.fabric)o.material=upholstered;});
      if(z>600){g.name='Sofa de lino con cojines tejidos';for(const p of [...g.children])if(p.isMesh&&p.material===m.linen)g.remove(p);cushion(g,-g.userData.width/2+.42,.68,.06);cushion(g,g.userData.width/2-.42,.68,.06);}
    }
    if(g.userData.asset==='modern_arm_chair_01'&&z===1208){
      g.clear();g.rotation.y+=Math.PI;g.name='Butaca de madera curvada y lana';g.userData.asset='reference-wool-armchair';
      for(const side of [-1,1]){
        tube(g,[[side*.27,.02,.28],[side*.25,.44,.23],[side*.27,.71,.06],[side*.26,.78,-.25]],.025,oak);
        tube(g,[[side*.27,.02,-.25],[side*.24,.45,-.24],[side*.26,.78,-.25]],.025,oak);
      }
      tube(g,[[-.26,.78,-.25],[-.15,.80,-.31],[.15,.80,-.31],[.26,.78,-.25]],.028,oak);
      box(g,0,.43,0,.55,.07,.57,oak);box(g,0,.50,.02,.58,.13,.57,wool,.06);
      const back=box(g,0,.69,-.20,.48,.35,.09,wool,.04);back.rotation.x=-.15;cushion(g,0,.66,-.10,.40,.23);
    }
    if(g.userData.kind==='table'&&x===1450&&z===1120){
      g.clear();g.name='Mesa de centro de vidrio y madera envejecida';
      box(g,0,.12,0,1.14,.16,.62,aged,.015);
      for(const a of [-.49,.49])for(const b of [-.23,.23])cylinder(g,a,.26,b,.015,.015,.24,brass);
      const top=box(g,0,.395,0,1.30,.018,.76,glass,.007);top.castShadow=false;
      books(g,-.27,.43,0);plant(g,.32,.41,0,.30);
    }
    if(g.userData.kind==='table'&&x===1530&&z===1110){
      g.clear();g.name='Puf de cuero capitone';
      for(const a of [-.25,.25])for(const b of [-.25,.25])cylinder(g,a,.11,b,.025,.02,.22,aged);
      box(g,0,.27,0,.67,.19,.65,leather,.05);
      const geo=new T.PlaneGeometry(.65,.63,56,56);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){const xx=pos.getX(i),zz=pos.getZ(i);let dip=0;for(const a of [-.20,0,.20])for(const b of [-.20,0,.20])dip+=.023*Math.exp(-((xx-a)**2+(zz-b)**2)/.0015);pos.setY(i,.377-dip+.002*Math.sin(xx*110+zz*35));}geo.computeVertexNormals();mesh(g,geo,leather);
      for(const a of [-.20,0,.20])for(const b of [-.20,0,.20])cylinder(g,a,.357,b,.012,.012,.009,leather);
    }
    if(g.userData.kind==='bed'&&g.userData.room==='Dormitorio principal'){
      g.clear();g.name='Cama principal con respaldo de madera pintada y lino';const [w,d]=g.userData.dimensions;
      box(g,0,.21,0,w+.08,.26,d+.05,linen,.06);box(g,0,.42,0,w,.21,d,m.bedding,.09);
      box(g,0,.69,-d/2-.035,w+.18,1.18,.10,ivory,.014);box(g,0,1.30,-d/2-.035,w+.28,.065,.15,oak,.014).name='Remate respaldo principal';
      for(const px of [-w/4,w/4]){box(g,px,.84,-d/2+.027,w/2-.10,.68,.028,ivory,.003);for(const s of [-1,1])box(g,px+s*(w/4-.035),.85,-d/2+.05,.024,.73,.014,ivory,.002);}
      const quilt=material(m.bedding,'#b7b9b2');
      const coverGeo=new T.PlaneGeometry(w+.22,d-.15,64,64);coverGeo.rotateX(-Math.PI/2);const p=coverGeo.attributes.position;
      for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getZ(i);p.setY(i,.56-.24*Math.max(0,(Math.abs(xx)-w/2+.12)/.12)+.007*Math.cos(xx*80)*Math.cos(zz*80)+.008*Math.sin(zz*16));}coverGeo.computeVertexNormals();mesh(g,coverGeo,quilt,0,0,.17);
      for(const px of [-w/4,w/4]){const pillow=box(g,px,.68,-.61,.78,.21,.48,quilt,.09);pillow.rotation.x=-.1;}
      const blanket=new T.PlaneGeometry(w+.16,.62,48,24);blanket.rotateX(-Math.PI/2);const bp=blanket.attributes.position;
      for(let i=0;i<bp.count;i++){const xx=bp.getX(i),zz=bp.getZ(i);bp.setY(i,.591-.12*Math.max(0,(Math.abs(xx)-w/2+.07)/.07)+.012*Math.sin(xx*22+zz*9));}blanket.computeVertexNormals();mesh(g,blanket,knit,0,0,.66);
      for(const px of [-w/2-.30,w/2+.30]){
        box(g,px,.38,-.885,.44,.54,.42,ivory,.012);box(g,px,.67,-.885,.48,.045,.45,oak,.009).name='Cubierta velador principal';
        for(const y of [.30,.54]){box(g,px,y,-.665,.37,.18,.024,ivory,.003);const handle=mesh(g,new T.TorusGeometry(.022,.004,6,18),brass,px,y,-.645);handle.rotation.x=.1;}
        for(const dx of [-.17,.17])for(const dz of [-1.045,-.725])box(g,px+dx,.065,dz,.04,.13,.04,ivory,.004);
        lamp(g,px,.70,-.925,.44,false);
      }
    }
  }
  rug(1499,1127,3.60,3.45);rug(960,1490,2.5,3.5);
  const cabinet=place('Vitrina rojo oxido',1462,1303,Math.PI);
  box(cabinet,0,.43,0,.75,.72,.34,red,.012);box(cabinet,0,1.82,0,.80,.06,.38,red,.005);
  box(cabinet,0,1.29,-.15,.75,1.02,.03,red,.002);
  for(const x of [-.356,.356])box(cabinet,x,1.29,0,.038,1.02,.34,red,.003);
  const cabinetGlass=glass.clone();cabinetGlass.opacity=.10;cabinetGlass.envMapIntensity=.35;
  for(const y of [.87,1.18,1.51])box(cabinet,0,y,.12,.62,.026,.26,aged,.002);
  for(const x of [-.175,.175]){
    box(cabinet,x,1.30,.186,.31,.94,.018,cabinetGlass,.001);
    for(const dx of [-.157,.157])box(cabinet,x+dx,1.30,.20,.037,.98,.032,red,.002);
    for(const y of [.82,1.78])box(cabinet,x,y,.20,.35,.042,.035,red,.003);
    box(cabinet,x,.44,.185,.325,.58,.027,red,.003);box(cabinet,x,.44,.207,.25,.44,.020,red,.001);
    for(const y of [.51,1.05])mesh(cabinet,new T.SphereGeometry(.014,10,8),brass,x*.23,y,.23);
  }
  for(const x of [-.29,.29])box(cabinet,x,.05,0,.075,.10,.30,red,.005);
  for(const x of [-.21,-.08,.12]){cylinder(cabinet,x,1.02,.08,.024,.02,.19,glass);cylinder(cabinet,x,1.24,.08,.021,.04,.11,ceramic);}
  const sideboard=place('Aparador de madera envejecida',1556,1303,Math.PI);
  box(sideboard,0,.46,0,1.68,.63,.34,aged,.007);box(sideboard,0,.80,0,1.75,.05,.38,oak,.009);
  for(const x of [-.69,.69])for(const z of [-.10,.10])box(sideboard,x,.09,z,.055,.18,.055,oak,.006);
  for(let i=0;i<4;i++){const x=(i-1.5)*.406;box(sideboard,x,.48,.18,.391,.56,.022,material(aged,['#858174','#999184','#797667','#8b8577'][i]),.003);cylinder(sideboard,x+.14,.49,.207,.009,.009,.035,brass);}
  books(sideboard,-.40,.853,.04);plant(sideboard,.48,.825,0,.48);lamp(sideboard,-.65,.825,-.01,.48,true);
  frame('Cuadro abstracto sobre aparador',1556,1315,1.78,1.62,1.08,'red',Math.PI,false);
  // The short return is solid wall; the adjoining hall passage is left entirely open.
  frame('Obra figurativa con marco plateado',1624,1167,1.85,.70,1.02,'folk',-Math.PI/2);
  const floorLamp=place('Lampara de pie tejida living',1386,1237);lamp(floorLamp,0,0,0,1.50,true);
  const greenery=place('Planta interior living',1383,1178);plant(greenery,0,0,0,1.05);
  const tv=place('Mueble de TV con cestos ordenados',892,1488,Math.PI/2);
  for(const y of [.11,.50,.85])box(tv,0,y,0,1.90,.045,.43,oak,.006);
  for(const x of [-.93,-.31,.31,.93])box(tv,x,.47,0,.038,.75,.43,oak,.004);
  box(tv,0,.46,-.205,1.90,.72,.025,aged,.002);
  for(const y of [.29,.67])for(const x of [-.62,0,.62]){box(tv,x,y,.015,.49,.28,.34,woven,.014);box(tv,x,y+.035,.19,.11,.035,.008,black,.005);}
  box(tv,0,1.30,-.02,1.38,.79,.045,black,.012);
  const screen=new T.MeshPhysicalMaterial({color:'#141b1a',roughness:.33,metalness:0,clearcoat:.4,envMapIntensity:.25});box(tv,0,1.30,.007,1.33,.745,.008,screen,.003);
  for(const x of [-.45,.45])tube(tv,[[x-.09,.878,.10],[x,1.01,-.02],[x+.09,.878,.10]],.012,black);
  frame('Grabado de tinta sala',879,1598,1.69,.72,1.04,'ink',Math.PI/2);
  frame('Cuadro figurativo dormitorio',679,1464,1.88,.68,.97,'folk',-Math.PI/2);
  frame('Grabado dormitorio',679,1531,1.88,.68,.97,'ink',-Math.PI/2);
  const masterLamp=place('Lectura dormitorio principal',500,1410);plant(masterLamp,0,0,0,.70);
  house.registerMaterials();
  return {root,lampPoints,emissiveMaterials,revision:'referencias-septiembre-2026'};
}
