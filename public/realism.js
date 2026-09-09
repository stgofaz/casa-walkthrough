import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { addDecoration } from './decoration.js';

export async function addRealism(house,scene,renderer){
  const textures=new T.TextureLoader(),gltf=new GLTFLoader(),m=house.mats;
  const loaded=[],errors=[];
  async function texture(path,color=false,repeat=1){
    const t=await textures.loadAsync(path);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);
    t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;return t;
  }
  try{
    const diffuse=await texture('assets/oak_veneer_01/Diffuse.jpg',true);
    const normal=await texture('assets/oak_veneer_01/nor_gl.jpg');
    const rough=await texture('assets/oak_veneer_01/Rough.jpg');
    const oldWood=m.wood.map;
    const timbers=new Set([m.wood,m.acacia,m.mara,m.rauli]);
    house.roofs.traverse(o=>{if(o.isMesh&&o.material.map===oldWood)timbers.add(o.material);});
    for(const mat of timbers){
      mat.map=diffuse;mat.normalMap=normal;mat.normalScale.set(.18,.18);mat.roughnessMap=rough;mat.roughness=.7;mat.bumpMap=null;mat.needsUpdate=true;
    }
    m.wood.color.set('#dad0be');m.acacia.color.set('#e7ddc9');m.mara.color.set('#e5d6bd');m.rauli.color.set('#c9a485');
    const groups=Array.from({length:4},()=>[]),S=house.data.scalePointsPerMetre;
    for(const [name,r,kind] of house.data.rooms){
      if(kind!=='wood'&&name!=='Bano principal')continue;
      const a=house.pt(r[0],r[1]),b=house.pt(r[2],r[3]);
      let row=0;
      for(let z=a.z;z<b.z-.001;z+=.197,row++){
        let col=0;
        for(let x=a.x-(row%3)*.4;x<b.x-.001;x+=1.2,col++){
          const left=Math.max(x,a.x),right=Math.min(x+1.2,b.x),depth=Math.min(.197,b.z-z);
          if(right-left>.006)groups[(row+col)%4].push({x:(left+right)/2,z:z+depth/2,w:right-left-.002,d:depth-.002});
        }
      }
    }
    groups.forEach((tiles,i)=>{
      const map=diffuse.clone(),n=normal.clone(),r=rough.clone();
      for(const t of [map,n,r]){t.repeat.set(.18,1.1);t.offset.set(i*.2,i*.17);t.rotation=Math.PI/2;t.needsUpdate=true;}
      const mat=new T.MeshStandardMaterial({color:new T.Color('#c2a886').multiplyScalar(.96+i*.025),map,normalMap:n,normalScale:new T.Vector2(.12,.12),roughnessMap:r,roughness:.64});
      mat.name='Arbor Canela 19.7x120 - veta fotografica referencial';
      const mesh=new T.InstancedMesh(new T.BoxGeometry(1,.004,1),mat,tiles.length),dummy=new T.Object3D();
      tiles.forEach((tile,index)=>{dummy.position.set(tile.x,.050,tile.z);dummy.scale.set(tile.w,1,tile.d);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);});
      mesh.receiveShadow=true;mesh.name='Despiece porcelanato 19.7 x 120 cm';house.structure.add(mesh);
    });
    m.floor.color.set('#867961');m.floor.map=null;m.floor.bumpMap=null;m.floor.needsUpdate=true;
    const fabricNormal=await texture('assets/fabric_pattern_07/nor_gl.jpg',false,2);
    const fabricRough=await texture('assets/fabric_pattern_07/Rough.jpg',false,2);
    for(const mat of [m.fabric,m.linen,m.bedding]){
      mat.map=null;mat.normalMap=fabricNormal;mat.normalScale.set(.24,.24);mat.roughnessMap=fabricRough;mat.roughness=.96;mat.needsUpdate=true;
    }
    m.fabric.color.set('#858e88');m.linen.color.set('#d9d5c9');
    const plaster=await texture('assets/white_plaster_rough_01/nor_gl.jpg',false,1.3);
    for(const mat of [m.wall,m.exterior,m.fascia]){
      mat.map=null;mat.bumpMap=null;mat.normalMap=plaster;mat.normalScale.set(.16,.16);mat.roughness=.92;mat.needsUpdate=true;
    }
    loaded.push('PBR roble, tela y estuco');
  }catch(error){errors.push(`Texturas: ${error.message}`);}
  for(const id of ['modern_arm_chair_01','dining_chair_02']){
    try{
      const asset=(await gltf.loadAsync(`assets/${id}/${id}.gltf`)).scene;
      asset.updateMatrixWorld(true);
      const bounds=new T.Box3().setFromObject(asset),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
      const scale=(id==='dining_chair_02'?.93:.86)/size.y;
      asset.scale.multiplyScalar(scale);asset.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
      asset.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const mat of Array.isArray(o.material)?o.material:[o.material]){if(mat.map)mat.map.anisotropy=8;}}});
      const places=[];house.furniture.traverse(o=>{if(o.userData.asset===id)places.push(o);});
      for(const place of places){place.clear();place.add(asset.clone(true));place.userData.loaded=true;}
      loaded.push(`${id}: ${places.length}`);
    }catch(error){errors.push(`${id}: ${error.message}`);}
  }
  try{
    const hdr=await new RGBELoader().loadAsync('assets/sunset.hdr');hdr.mapping=T.EquirectangularReflectionMapping;
    const generator=new T.PMREMGenerator(renderer),env=generator.fromEquirectangular(hdr);
    scene.environment=env.texture;scene.background=hdr;scene.backgroundIntensity=.48;scene.backgroundBlurriness=0;
    scene.backgroundRotation.y=2.4;scene.environmentRotation.y=2.4;scene.environmentIntensity=.36;generator.dispose();
    loaded.push('Belfast Sunset HDR 2K');
  }catch(error){errors.push(`Cielo HDR: ${error.message}`);}
  const decor=new T.Group();decor.name='Ambientacion interior referencial';house.furniture.add(decor);
  const metal=new T.MeshStandardMaterial({color:'#30322e',roughness:.35,metalness:.7});
  const lampMat=new T.MeshStandardMaterial({color:'#fff1ce',emissive:'#ffc379',emissiveIntensity:2.8,roughness:.3});
  function mesh(geometry,material,x,z,y){const o=new T.Mesh(geometry,material);o.position.copy(house.pt(x,z,y));o.castShadow=true;o.receiveShadow=true;decor.add(o);return o;}
  const lampPoints=[];
  for(const [x,z,y] of [[1505,880,2.62],[1510,443,2.58],[1790,920,2.48]]){
    mesh(new T.CylinderGeometry(.30,.38,.10,48),metal,x,z,y);
    mesh(new T.CylinderGeometry(.345,.345,.012,48),lampMat,x,z,y-.055);
    const top=z<550?3.50:z<1000&&x<1600?3.55:2.64;
    mesh(new T.CylinderGeometry(.006,.006,top-y,8),metal,x,z,(top+y)/2);
    lampPoints.push(house.pt(x,z,y-.13));
  }
  for(const [x,z] of [[1735,443],[1690,1290],[1690,1445],[920,1635],[600,1645],[1310,750],[1310,1100],[1100,1330]]){
    mesh(new T.CylinderGeometry(.055,.055,.025,20),metal,x,z,2.60);
    mesh(new T.CylinderGeometry(.045,.045,.006,20),lampMat,x,z,2.582);
    lampPoints.push(house.pt(x,z,2.50));
  }
  const ceramic=new T.MeshStandardMaterial({color:'#c6cac5',roughness:.42});
  const bookMats=['#3e554c','#bfbba8','#485967'].map(color=>new T.MeshStandardMaterial({color,roughness:.9}));
  for(const [x,z,y] of [[1508,442,.52],[1820,1690,.84]]){
    for(let i=0;i<3;i++){const b=mesh(new T.BoxGeometry(.25,.018,.32),bookMats[i],x,z,y+i*.019);b.rotation.y=.12+i*.05;}
    const points=[new T.Vector2(.06,0),new T.Vector2(.09,.03),new T.Vector2(.095,.16),new T.Vector2(.05,.25),new T.Vector2(.04,.30)];
    mesh(new T.LatheGeometry(points,32),ceramic,x+22,z,y-.02);
  }
  const art={};
  for(const [key,file] of Object.entries({red:'abstract-red',folk:'folk-portrait',ink:'ink-study'})){
    try{art[key]=await texture(`assets/decor/${file}.png`,true);art[key].wrapS=art[key].wrapT=T.ClampToEdgeWrapping;loaded.push(`Obra original: ${file}`);}
    catch(error){errors.push(`Arte ${file}: ${error.message}`);}
  }
  const decoration=addDecoration(house,art);lampPoints.push(...decoration.lampPoints);
  const decorativeLights=new Set(decoration.lampPoints);
  loaded.push('Mobiliario y decoracion segun fotografias de referencia');
  const glow=decoration.emissiveMaterials.map(mat=>[mat,mat.emissiveIntensity]);
  // Only three nearby luminaires contribute at once, keeping mobile shader cost bounded.
  const lights=Array.from({length:3},()=>{const l=new T.SpotLight('#ffd39a',22,6,Math.PI*.42,.55,2);scene.add(l,l.target);return l;});
  let enabled=true;
  function updateLights(camera){
    const nearest=lampPoints.map(position=>({position,d:position.distanceToSquared(camera.position),power:decorativeLights.has(position)?3:22})).sort((a,b)=>a.d-b.d);
    lights.forEach((light,i)=>{light.position.copy(nearest[i].position);light.target.position.copy(light.position).setY(.1);light.intensity=enabled&&house.furniture.visible?nearest[i].power:0;});
  }
  function setLighting(on){enabled=on;lampMat.emissiveIntensity=on?2.8:0;for(const [mat,intensity] of glow)mat.emissiveIntensity=on?intensity:0;}
  house.registerMaterials();
  return {loaded,errors,updateLights,setLighting,decoration};
}
