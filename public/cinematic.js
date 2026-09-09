import * as T from 'three';

export function createCinematic(house){
  const shot=(name,seconds,positions,targets,fov=54)=>({name,seconds,fov,
    path:new T.CatmullRomCurve3(positions.map(p=>house.pt(...p)),false,'centripetal'),
    aim:new T.CatmullRomCurve3(targets.map(p=>house.pt(...p)),false,'centripetal')});
  const shots=[
    shot('Llegada',12,[[2180,1450,2.0],[2050,1440,1.82],[1930,1440,1.70]],[[1740,1415,1.5],[1740,1415,1.5],[1765,1415,1.5]],48),
    shot('Living hacia el hall',19,[[1385,1040,1.67],[1400,1140,1.67],[1490,1260,1.67],[1580,1272,1.67],[1680,1272,1.67]],[[1540,1080,1.30],[1610,1240,1.45],[1690,1270,1.5],[1710,1320,1.5],[1700,1430,1.5]],61),
    shot('Cocina',12,[[1665,1010,1.66],[1690,990,1.66],[1715,960,1.66]],[[1810,872,1.2],[1838,858,1.3],[1850,825,1.4]],58),
    shot('Hall y jardin interior',12,[[1700,1290,1.66],[1710,1350,1.66],[1705,1440,1.66]],[[1640,1480,1.45],[1590,1480,1.4],[1550,1480,1.4]],65),
    shot('Galeria de patios',14,[[1030,1325,1.7],[1150,1325,1.7],[1300,1325,1.7]],[[1370,1140,1.6],[1450,1070,1.6],[1510,970,1.6]],54),
    shot('Quincho',14,[[1290,518,1.7],[1300,425,1.7],[1315,325,1.7]],[[1610,410,1.4],[1590,330,1.4],[1610,210,1.4]],61),
    shot('Dormitorio principal',12,[[443,1577,1.64],[456,1560,1.64],[476,1558,1.64]],[[570,1480,1.10],[578,1474,1.12],[593,1470,1.15]],60),
    shot('Bano principal y tina isla',10,[[548,1719,1.55],[527,1710,1.55],[510,1701,1.55]],[[460,1746.7,.60],[452,1747,.65],[434,1740,.83]],66),
  ];
  let time=0,playing=false,speed=1;
  const duration=shots.reduce((sum,s)=>sum+s.seconds,0);
  function sample(at=time){
    const clamped=T.MathUtils.clamp(at,0,duration);let start=0,index=0;
    while(index<shots.length-1&&clamped>=start+shots[index].seconds){start+=shots[index].seconds;index++;}
    const s=shots[index],raw=T.MathUtils.clamp((clamped-start)/s.seconds,0,1),t=raw*raw*(3-2*raw);
    // Fade to black at chapter boundaries; camera never interpolates through the house.
    const fade=Math.max(index>0?1-Math.min(1,(clamped-start)/.45):0,index<shots.length-1?1-Math.min(1,(start+s.seconds-clamped)/.45):0);
    return {position:s.path.getPoint(t),target:s.aim.getPoint(t),fov:s.fov,index,name:s.name,fade,time:clamped,duration};
  }
  return {shots,duration,sample,
    get time(){return time;},get playing(){return playing;},get speed(){return speed;},
    play(){if(time>=duration)time=0;playing=true;},pause(){playing=false;},
    seek(value){time=T.MathUtils.clamp(Number(value)||0,0,duration);},
    setSpeed(value){speed=T.MathUtils.clamp(Number(value)||1,.5,2);},
    chapter(delta){const index=T.MathUtils.clamp(sample().index+delta,0,shots.length-1);time=shots.slice(0,index).reduce((sum,s)=>sum+s.seconds,0);},
    tick(dt){if(playing){time=Math.min(duration,time+Math.min(dt,.15)*speed);if(time>=duration)playing=false;}return sample();}
  };
}
