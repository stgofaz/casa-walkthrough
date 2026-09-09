import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// D01-D12 supply joinery and equipment; all placements remain on the latest G01.
export function buildConstructionDetails({furniture,mats:m,pt,data}) {
  const root=new T.Group();root.name='Detalles constructivos D01-D12';furniture.add(root);
  const chrome=new T.MeshStandardMaterial({color:'#abb4b7',metalness:.92,roughness:.24});
  const mirror=new T.MeshStandardMaterial({color:'#b6c6c7',metalness:1,roughness:.10,envMapIntensity:.35});
  const white=new T.MeshStandardMaterial({color:'#e9eae5',roughness:.65});
  const privacy=m.glass.clone();privacy.opacity=.37;privacy.roughness=.58;
  const groups=[];
  function place(name,sheet,x,z,angle=0){
    const g=new T.Group();g.name=name;g.position.copy(pt(x,z,.047));g.rotation.y=angle;
    g.userData={sourceSheet:sheet,planPosition:[x,z]};root.add(g);groups.push(g);return g;
  }
  function mesh(g,geometry,material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(g,x,y,z,w,h,d,material=m.acacia,r=0){
    return mesh(g,r?new RoundedBoxGeometry(w,h,d,3,Math.min(r,h*.4,d*.4)):new T.BoxGeometry(w,h,d),material,x,y+h/2,z);
  }
  function pipe(g,points,r=.012,material=chrome){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),material);}
  function cylinder(g,x,y,z,r,h,material=chrome){return mesh(g,new T.CylinderGeometry(r,r,h,24),material,x,y,z);}
  function roundPath(w,d,r,Type=T.Shape){
    const p=new Type(),x=-w/2,z=-d/2;p.moveTo(x+r,z);p.lineTo(x+w-r,z);p.quadraticCurveTo(x+w,z,x+w,z+r);p.lineTo(x+w,z+d-r);p.quadraticCurveTo(x+w,z+d,x+w-r,z+d);p.lineTo(x+r,z+d);p.quadraticCurveTo(x,z+d,x,z+d-r);p.lineTo(x,z+r);p.quadraticCurveTo(x,z,x+r,z);return p;
  }
  function perforatedTop(g,w,d,y,holes,material=m.quartz,thickness=.03){
    const shape=roundPath(w,d,.015);
    for(const h of holes){const p=roundPath(h.w,h.d,.04,T.Path);for(const c of p.curves)for(const key of ['v0','v1','v2','v3'])if(c[key]){c[key].x+=h.x||0;c[key].y+=h.z||0;}shape.holes.push(p);}
    const o=mesh(g,new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,curveSegments:10}),material,0,y,0);o.rotation.x=Math.PI/2;return o;
  }
  function basin(g,x,y,z,w,d,h,material=m.ceramic){
    const path=roundPath(w,d,Math.min(w,d)*.18,T.Path).getSpacedPoints(64),verts=[],indices=[];
    const section=[[.70,-h],[.96,-h*.60],[1,0],[.95,.01],[.91,-h*.1],[.84,-h*.72],[.55,-h*.87],[0,-h*.87]];
    for(const [scale,dy] of section)for(const p of path)verts.push(p.x*scale,dy,p.y*scale);
    const n=path.length;
    for(let row=0;row<section.length-1;row++)for(let i=0;i<n-1;i++){const a=row*n+i;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mat=material.clone();mat.side=T.DoubleSide;
    mesh(g,geo,mat,x,y,z).name='Cubeta abierta con desague';cylinder(g,x,y-h*.87+.005,z,.021,.004);return g;
  }
  function tap(g,x,y,z,height=.20,reach=.16){pipe(g,[[x,y,z],[x,y+height-.04,z],[x,y+height,z+reach*.55],[x,y+height-.02,z+reach]]);box(g,x+.045,y+.045,z,.015,.055,.065,chrome,.005);}
  function vanity(name,x,z,w,angle,mirrorWidth,round=false){
    const g=place(name,'D01/D02',x,z,angle),d=.48;g.userData={...g.userData,width:w,counterHeight:.855,mirrorStandOff:.02};
    box(g,0,.22,0,w,.025,d);box(g,0,.25,-d/2,w,.55,.018);
    for(const xx of [-w/2+.009,w/2-.009])box(g,xx,.245,0,.018,.555,d);
    for(const y of [.30,.545]){box(g,0,y,d/2,w-.008,.23,.018,m.acacia,.003);box(g,0,y+.23,d/2-.006,w-.035,.014,.026,m.black);}
    perforatedTop(g,w+.025,d+.025,.855,[{w:Math.min(.46,w-.13),d:.32,z:.025}]);
    basin(g,0,.855,.025,Math.min(.48,w-.11),.34,.14);tap(g,0,.855,-.18);
    if(round){const o=mesh(g,new T.CircleGeometry(.50,64),mirror,0,1.74,-d/2-.025);o.name='Espejo circular diametro 100 cm';o.castShadow=false;}
    else box(g,0,1.06,-d/2-.025,mirrorWidth,1.35,.008,mirror).name='Espejo separado 20 mm del muro';
    return g;
  }
  vanity('Vanitorio bano 1',802,1717,.80,Math.PI/2,1.65);
  vanity('Vanitorio bano 2',1147,1713,.80,-Math.PI/2,1.55);
  vanity('Vanitorio visitas y espejo circular',1804,1574,.60,Math.PI,.60,true);
  vanity('Vanitorio servicio',1935,1222,.60,Math.PI,.60);

  function insetTub(name,x,z,w,d,angle=0){
    const g=place(name,'D01/D02',x,z,angle);g.userData.size=[w,d];
    for(const xx of [-w/2+.035,w/2-.035])box(g,xx,0,0,.07,.49,d,m.bathTile);
    for(const zz of [-d/2+.035,d/2-.035])box(g,0,0,zz,w,.49,.07,m.bathTile);
    perforatedTop(g,w,d,.49,[{w:w-.11,d:d-.11}],m.ceramic,.035);
    basin(g,0,.49,0,w-.10,d-.10,.36);tap(g,-w/2+.12,.50,0,.12,.16);
  }
  insetTub('Tina empotrada bano 1',823,1801,1.60,.70);
  insetTub('Tina empotrada servicio',2010,1204,1.40,.70,Math.PI/2);

  function shower(name,x,z,w,d,angle=0){
    const g=place(name,'D01/D02',x,z,angle);g.userData={...g.userData,glassThickness:.01,slope:.02};
    const floor=mesh(g,new T.PlaneGeometry(w,d),m.bathTile,0,.018,0);floor.rotation.x=-Math.PI/2;floor.rotation.z=.02;
    box(g,0,.005,-d/2+.07,w-.10,.008,.035,chrome);
    const fixed=w-.60;
    box(g,-w/2+fixed/2,.03,d/2,fixed,2.1,.01,m.glass).name='Mampara fija templada 10 mm';
    const hinge=new T.Group();hinge.position.set(w/2,0,d/2);hinge.rotation.y=-Math.PI*.43;g.add(hinge);
    box(hinge,-.30,.03,0,.60,2.1,.01,m.glass).name='Hoja mampara 60 cm abierta';
    for(const y of [.25,1.82])box(hinge,-.025,y,0,.045,.065,.035,chrome);
    pipe(hinge,[[-.51,.94,.015],[-.51,.94,.05],[-.51,1.10,.05],[-.51,1.10,.015]],.007);
    pipe(g,[[0,2.57,0],[0,2.28,0]],.012);cylinder(g,0,2.27,0,.125,.018).name='Rociador desde cielo';
    box(g,0,1.01,-d/2+.022,.16,.13,.025,chrome,.01);
    pipe(g,[[.09,1.01,-d/2+.045],[.21,.55,-d/2+.06],[.25,.42,-d/2+.06],[.26,1.18,-d/2+.06]],.005);
    return g;
  }
  shower('Ducha bano 2',1122,1807,1.57,.72,Math.PI);
  shower('Ducha visitas',1877,1569,.92,.92,Math.PI);

  function wardrobe(name,sheet,x,z,w,d,angle=0,closed=true,doors=4,height=2.445){
    const g=place(name,sheet,x,z,angle),inside=closed?white:m.acacia;g.userData={...g.userData,width:w,depth:d,height,plinth:.13,doors:closed?doors:0};
    box(g,0,0,0,w-.08,.13,d-.08,m.black);box(g,0,.13,0,w,.018,d,inside);box(g,0,height-.018,0,w,.018,d,inside);
    box(g,0,.148,-d/2+.008,w,height-.148,.015,inside);
    const n=Math.max(1,Math.round(w/.70)),module=w/n;
    for(let i=0;i<=n;i++)box(g,-w/2+i*module,.148,0,.018,height-.148,d,inside);
    for(let i=0;i<n;i++){
      const cx=-w/2+(i+.5)*module;
      box(g,cx,2.005,0,module,.018,d,inside);
      if(i%2===0){
        for(const y of [1.04,1.87])pipe(g,[[cx-module/2+.02,y,0],[cx+module/2-.02,y,0]],.012);
        if(!closed)for(let j=0;j<4;j++){
          const xx=cx+(j-1.5)*.105;
          pipe(g,[[xx,1.84,0],[xx,1.91,-.045],[xx,1.96,-.01],[xx,1.91,.015]],.003);
          pipe(g,[[xx,1.84,0],[xx-.17,1.72,0],[xx+.17,1.72,0],[xx,1.84,0]],.005,m.wood);
        }
      }else{
        for(const y of [.47,.72,.97,1.24,1.57])box(g,cx,y,0,module-.018,.018,d-.035,inside);
        for(const y of [.17,.42,.67])box(g,cx,y,d/2-.02,module-.025,.23,.018,inside);
      }
    }
    if(closed)for(let i=0;i<doors;i++){
      const x=-w/2+(i+.5)*w/doors,leaf=w/doors-.004;
      box(g,x,.145,d/2+.005,leaf,height-.15,.018,m.closet);
      box(g,x+(i%2?-.1:.1)*leaf,.97,d/2+.032,.014,.16,.025,chrome,.004);
    }
    return g;
  }
  wardrobe('Closet dormitorio 1','D03',749,1586.5,2.065,.60,Math.PI);
  wardrobe('Closet dormitorio 2','D03',1191,1586.5,2.065,.60,Math.PI);
  wardrobe('Closet dormitorio 4','D04',1786,1254,1.00,.60,Math.PI/2,true,2);
  wardrobe('Walking closet principal lateral','D03',754,1793,3.05,.50,-Math.PI/2,false);
  wardrobe('Walking closet principal fondo','D03',693,1863.5,1.55,.50,Math.PI,false);
  wardrobe('Bodega interior estantes','D04',1451,1772,2.76,.50,-Math.PI/2,false,0,2.10);
  const wcMirror=place('Espejo vestidor 70 x 190','D03',652,1774,Math.PI/2);wcMirror.userData.wallMounted=true;
  box(wcMirror,0,.20,0,.70,1.90,.014,mirror);
  const shelves=place('Librero consulta asimetrico','D04',1840,1616,0),cw=2.245,cd=.47;
  shelves.userData={...shelves.userData,width:cw,depth:cd,height:2.60};
  box(shelves,0,0,0,cw-.06,.13,cd-.04,m.black);box(shelves,0,.13,-cd/2,cw,2.47,.015);
  for(const x of [-cw/2,0,cw/2])box(shelves,x,.13,0,.018,2.47,cd);
  for(const y of [.13,.63,1.15,1.67,2.18,2.58])box(shelves,0,y,0,cw,.018,cd);
  for(const [x,y] of [[-.62,1.15],[.38,1.67],[.65,.63],[-.30,2.18]])box(shelves,x,y,0,.018,.50,cd);
  for(let i=0;i<4;i++)box(shelves,-cw/2+(i+.5)*cw/4,.15,cd/2,cw/4-.005,.46,.018);

  function appliance(name,x,z,angle=0,dryer=false){
    const g=place(name,'D05/D06',x,z,angle);box(g,0,.015,0,.60,.83,.60,white,.022);
    const ring=mesh(g,new T.TorusGeometry(.20,.024,12,48),chrome,0,.43,.308);ring.name='Aro puerta frontal';
    mesh(g,new T.CircleGeometry(.183,40),m.black,0,.43,.305);
    mesh(g,new T.CircleGeometry(.143,40),privacy,0,.43,.31);
    box(g,.13,.74,.305,.19,.045,.012,m.black,.005);mesh(g,new T.CylinderGeometry(.025,.025,.018,20),chrome,-.20,.77,.31).rotation.x=Math.PI/2;
    g.userData.appliance=dryer?'dryer':'washingMachine';return g;
  }
  appliance('Lavadora frontal',1883,1074,Math.PI/2);
  appliance('Secadora frontal bajo cubierta',1939,1134,Math.PI);
  const laundry=place('Mueble lavadero con lavacopas','D05/D06',1974,1134,Math.PI);
  for(const x of [-1.04,1.04])box(laundry,x,.13,0,.018,.75,.55,m.olive);
  box(laundry,0,.13,-.265,2.10,.75,.02,m.olive);
  perforatedTop(laundry,2.12,.58,.93,[{x:-.70,w:.41,d:.40}],m.quartz,.04);
  basin(laundry,-.70,.93,0,.43,.42,.25,chrome);tap(laundry,-.70,.93,-.24,.28,.21);
  for(const x of [-.75,-.35,.05])box(laundry,x,.15,.28,.38,.74,.018,m.olive);
  const pantry=place('Despensa estanteria abierta','D06',1774.5,1141,Math.PI);
  for(const y of [.13,.45,.77,1.09,1.41,1.73,2.05,2.37])box(pantry,0,y,0,1.30,.018,.50,white);
  for(const x of [-.65,0,.65])box(pantry,x,.13,0,.018,2.26,.50,white);
  const freezer=place('Congelador despensa','D05/D06',1836,1122,Math.PI);
  box(freezer,0,0,0,.58,.85,.57,white,.025);box(freezer,0,.85,0,.59,.035,.58,white,.01);box(freezer,0,.77,.31,.19,.02,.025,chrome);

  const sink=place('Lavaplatos doble bajo cubierta','D05/D06',1857.5,925.5,Math.PI/2);
  sink.userData.basins=2;
  perforatedTop(sink,.90,.66,.93,[{x:-.215,w:.37,d:.42},{x:.215,w:.37,d:.42}],m.quartz,.04);
  for(const x of [-.215,.215])basin(sink,x,.925,0,.39,.44,.21,chrome);
  tap(sink,0,.93,-.27,.32,.25);
  const drainer=place('Ranuras escurridor cuarzo','D05',1857.5,963,Math.PI/2);
  for(let i=0;i<7;i++)box(drainer,-.19+i*.062,.931,0,.003,.001,.38,chrome);
  const dish=place('Lavavajillas integrado','D05',1855,883,Math.PI/2);
  box(dish,0,.13,.285,.59,.73,.018,m.olive);box(dish,0,.83,.30,.59,.035,.02,m.black);box(dish,0,.78,.324,.35,.018,.028,chrome);

  const glassCabinet=place('Vitrina cocina con estantes interiores','D05/D06',1832,769,0);
  for(const x of [-.76,.76])box(glassCabinet,x,1.618,0,.018,.93,.49,m.olive);
  box(glassCabinet,0,1.618,-.235,1.54,.93,.018,m.acacia);
  for(const y of [1.618,1.93,2.24,2.53])box(glassCabinet,0,y,0,1.54,.015,.49,m.acacia);
  for(let i=0;i<5;i++)cylinder(glassCabinet,-.58+i*.27,1.72,.09,.052,.15,m.ceramic);

  const quincho=place('Quincho doble parrilla y puertas metalicas','D12',1645,270,-Math.PI/2);
  quincho.userData.grills=2;
  for(const cx of [-.51,.51]){
    box(quincho,cx,.71,0,.92,.045,.68,m.black);
    for(let j=0;j<19;j++)box(quincho,cx-.43+j*.048,.76,0,.009,.012,.64,chrome);
  }
  box(quincho,0,.12,-.32,2.10,.58,.025,m.black);
  for(const x of [-1.05,0,1.05])box(quincho,x,0,0,.08,.80,.82,m.concrete);
  box(quincho,0,.07,0,2.18,.06,.82,m.concrete);
  for(let i=0;i<4;i++){
    const cx=-1.05+(i+.5)*2.10/4,w=2.10/4-.016;
    for(let j=0;j<8;j++)box(quincho,cx-w/2+(j+.5)*w/8,.12,.40,.022,.55,.022,m.black);
    for(const y of [.12,.65])box(quincho,cx,y,.40,w,.022,.03,m.black);
  }
  const bar=place('Isla quincho con lavacopas circular','D12',1550.5,191,0);
  const circularTop=roundPath(.99,.65,.01),hole=new T.Path();hole.absarc(0,0,.20,0,Math.PI*2,false);circularTop.holes.push(hole);
  const barTop=mesh(bar,new T.ExtrudeGeometry(circularTop,{depth:.15,bevelEnabled:false,curveSegments:48}),m.concrete,0,1.15,0);barTop.rotation.x=Math.PI/2;
  const profile=[[0,-.21],[.14,-.21],[.19,-.1],[.20,0],[.193,.008],[.18,-.10],[.12,-.195],[0,-.195]].map(p=>new T.Vector2(...p));
  mesh(bar,new T.LatheGeometry(profile,64),chrome,0,1.15,0);tap(bar,0,1.15,-.25,.23,.18);
  return {root,groups};
}
