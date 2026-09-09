import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildMasterBathroom({furniture,mats:m,pt,data}){
  const layout=data.masterBathroom,root=new T.Group();root.name='Bano principal ampliado - ultima G01';furniture.add(root);
  const ceramic=new T.MeshPhysicalMaterial({color:'#eeeFEb',roughness:.23,clearcoat:.35,clearcoatRoughness:.18});
  const chrome=new T.MeshStandardMaterial({color:'#a6b0b2',metalness:.95,roughness:.20});
  const glass=m.glass.clone();glass.opacity=.10;glass.roughness=.06;glass.depthWrite=false;
  function mesh(g,geometry,material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(g,x,y,z,w,h,d,material,r=.01){return mesh(g,new RoundedBoxGeometry(w,h,d,4,Math.min(r,h*.4,d*.4)),material,x,y,z);}
  function cylinder(g,x,y,z,r,h,material=chrome){return mesh(g,new T.CylinderGeometry(r,r,h,32),material,x,y,z);}
  function pipe(g,points,r=.015){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),36,r,10,false),chrome);}
  function place(name,x,z){const g=new T.Group();g.name=name;g.position.copy(pt(x,z,.03));root.add(g);return g;}
  function bowlGeometry(profile,w,d,rectangular=false){
    const curve=new T.CatmullRomCurve3(profile.map(([r,y])=>new T.Vector3(r,y,0)),false,'centripetal');
    const samples=curve.getPoints(100).map(p=>new T.Vector2(Math.max(0,p.x),p.y));
    if(rectangular){
      const ring=roundedPath(T.Path,w,d,.07).getSpacedPoints(96),vertices=[],indices=[],n=ring.length;
      samples.forEach(p=>ring.forEach(v=>vertices.push(v.x*p.x,p.y,v.y*p.x)));
      for(let j=0;j<samples.length-1;j++)for(let i=0;i<n-1;i++){const a=j*n+i,b=a+n;indices.push(a,b+1,a+1,a,b,b+1);}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
    }
    const geo=new T.LatheGeometry(samples,96);geo.scale(w/2,1,d/2);return geo;
  }
  const [tx,tz]=layout.tub.center,[length,width,height]=layout.tub.size;
  const tub=place('Tina isla ovalada - huella G01',tx,tz);
  // A continuous section models the outside, rolled rim, inner basin and closed base.
  const profile=[[0,.018],[.52,.018],[.74,.04],[.88,.13],[.97,.37],[1,height-.035],[.99,height-.009],[.958,height],[.920,height-.014],[.896,height-.047],[.84,.29],[.73,.16],[.45,.128],[0,.128]];
  const shell=mesh(tub,bowlGeometry(profile,length,width),ceramic);shell.name='Casco continuo con interior hueco';
  const drain=cylinder(tub,0,.131,0,.025,.004);drain.name='Desague tina';
  const mixer=place('Griferia de pie tina isla',tx,tz+29);
  cylinder(mixer,0,.015,0,.06,.03);
  pipe(mixer,[[0,.025,0],[0,.79,0],[0,.91,-.04],[0,.92,-.17],[0,.89,-.23]]);
  pipe(mixer,[[0,.69,0],[.08,.69,0],[.08,.77,0]],.008);
  box(mixer,-.035,.49,0,.025,.18,.028,chrome,.01);
  pipe(mixer,[[-.03,.54,.03],[-.10,.25,.02],[-.08,.18,.015],[-.06,.58,.025]],.005);

  const [sx,sz,sxx,szz]=layout.shower.rect,sw=(sxx-sx)/data.scalePointsPerMetre,sd=(szz-sz)/data.scalePointsPerMetre;
  const shower=place('Ducha independiente 133 x 188 cm', (sx+sxx)/2,(sz+szz)/2);
  box(shower,0,.028,0,sw,.035,sd,ceramic,.018);
  box(shower,0,.048,sd/2-.08,sw-.17,.009,.035,chrome,.003);
  const backX=-sw/2+.06;
  pipe(shower,[[backX+.38,2.59,0],[backX+.38,2.28,0]],.012);
  const rain=cylinder(shower,backX+.38,2.27,0,.12,.018);rain.name='Rociador desde cielo - D01';
  box(shower,backX,1.06,0,.035,.13,.18,chrome,.02);
  const screen=place('Mampara ducha principal',401.6,1755.8);
  box(screen,0,1.08,0,.009,2.10,.89,glass,.002).castShadow=false;
  for(const z of [-.39,.39])box(screen,0,.11,z,.025,.045,.04,chrome,.002);
  const leaf=place('Puerta mampara abierta',401.6,1730.6);leaf.rotation.y=-.75;
  box(leaf,0,1.08,-.375,.009,2.10,.75,glass,.002).castShadow=false;
  pipe(leaf,[[.025,1.0,-.61],[.06,1.0,-.61],[.06,1.12,-.61],[.025,1.12,-.61]],.007);

  const [vx,vz,vxx,vzz]=layout.vanity.rect,vw=(vxx-vx)/data.scalePointsPerMetre,vd=(vzz-vz)/data.scalePointsPerMetre;
  const vanity=place('Vanitorio principal doble - huella G01',(vx+vxx)/2,(vz+vzz)/2);
  box(vanity,0,.24,0,vw,.05,vd,m.acacia,.008);
  for(const x of [-vw/2+.012,vw/2-.012])box(vanity,x,.53,0,.025,.57,vd,m.acacia,.004);
  box(vanity,0,.53,-vd/2+.012,vw,.57,.025,m.acacia,.004);
  for(const x of [-vw/4,vw/4])for(const y of [.425,.707]){
    box(vanity,x,y,vd/2+.005,vw/2-.012,.27,.024,m.acacia,.005);
    box(vanity,x,y+.132,vd/2-.008,vw/2-.04,.014,.025,m.black,.003);
  }
  function roundedPath(Path,w,d,r){const p=new Path(),x=-w/2,z=-d/2;p.moveTo(x+r,z);p.lineTo(x+w-r,z);p.quadraticCurveTo(x+w,z,x+w,z+r);p.lineTo(x+w,z+d-r);p.quadraticCurveTo(x+w,z+d,x+w-r,z+d);p.lineTo(x+r,z+d);p.quadraticCurveTo(x,z+d,x,z+d-r);p.lineTo(x,z+r);p.quadraticCurveTo(x,z,x+r,z);return p;}
  const topShape=roundedPath(T.Shape,vw+.025,vd+.025,.02);
  for(const x of [-vw/4,vw/4]){
    const hole=roundedPath(T.Path,.485,.325,.06);
    for(const curve of hole.curves)for(const key of ['v0','v1','v2','v3'])if(curve[key])curve[key].x+=x;
    topShape.holes.push(hole);
  }
  const top=mesh(vanity,new T.ExtrudeGeometry(topShape,{depth:.035,bevelEnabled:false,curveSegments:16}),m.quartz,0,.88,0);top.rotation.x=Math.PI/2;
  for(const x of [-vw/4,vw/4]){
    const basin=mesh(vanity,bowlGeometry([[0,0],[.6,.008],[.88,.05],[1,.12],[.965,.125],[.89,.10],[.65,.025],[0,.018]],.515,.355,true),ceramic,x,.759,0);basin.name='Lavamanos principal';
    cylinder(vanity,x,.781,0,.018,.003);
    pipe(vanity,[[x,.88,-vd/2+.025],[x,1.05,-vd/2+.025],[x,1.08,-vd/2+.11],[x,1.06,-vd/2+.16]],.012);
  }
  const mirrorMat=new T.MeshStandardMaterial({color:'#a6b6b4',metalness:.92,roughness:.10,envMapIntensity:.5});
  box(vanity,0,1.855,-vd/2+.020,vw,1.35,.008,mirrorMat,.002).name='Espejo vanitorio separado 20 mm - D01 adaptado a G01';
  const towel=m.linen.clone();towel.color.set('#d9dcD7');
  const rail=place('Toallero bano principal',558.6,1762);
  pipe(rail,[[0,.86,-.19],[-.07,.86,-.19],[-.07,.86,.19],[0,.86,.19]],.009);
  box(rail,-.072,.69,0,.022,.34,.27,towel,.008);
  return {root,tub,shower,vanity};
}
