window.TobiasVillageLife = (() => {
  function create(api) {
    const config=TobiasVillage;
    const sheets=[0,1,2].map(i=>{const image=new Image();image.src=`villagers-${i}.png`;return image;});
    const people=config.residents.map((p,i)=>({...p,home:{x:p.x,y:p.y},facing:'down',walking:false,phase:0,wait:1+i*.37,target:null,clock:i*.81,route:0,reverse:false,talks:0}));
    let pending=null,approachTarget=null,active=null,letters=0,elapsed=0,complete=false,voice=null,voiceCount=0;
    const layer=document.createElement('div');layer.className='story-world-ui';layer.hidden=true;api.stage.append(layer);
    const buttons=people.map(p=>{const b=document.createElement('button');b.className='world-interact village-interact';b.type='button';b.dataset.npc=p.id;b.setAttribute('aria-label',`Conversar com ${p.name}`);b.title=p.name;b.addEventListener('click',()=>request(p));layer.append(b);return b;});
    const dialogue=document.createElement('section');dialogue.id='storyDialogue';dialogue.className='story-dialogue';dialogue.setAttribute('role','dialog');dialogue.setAttribute('aria-modal','true');dialogue.setAttribute('aria-label','Conversa');
    dialogue.innerHTML='<button type="button" class="story-advance" aria-label="Avançar diálogo"><img class="story-portrait" alt=""><span class="story-copy"><strong class="story-speaker"></strong><span class="story-text" aria-hidden="true"></span></span><span class="story-arrow" aria-hidden="true">▾</span></button><span class="story-announcement" role="status" aria-live="polite"></span>';
    api.stage.append(dialogue);
    const advance=dialogue.querySelector('button'),portrait=dialogue.querySelector('img'),speaker=dialogue.querySelector('strong'),text=dialogue.querySelector('.story-text'),announcement=dialogue.querySelector('.story-announcement');
    function unlock(){try{voice ||= new (window.AudioContext||window.webkitAudioContext)();if(voice.state==='suspended')voice.resume().catch(()=>{});}catch{}}
    document.addEventListener('pointerdown',unlock,{once:true,capture:true});document.addEventListener('keydown',unlock,{once:true,capture:true});
    function blip(p){const settings=api.audio();if(!voice||voice.state!=='running'||settings.sfxMuted||!settings.sfxVolume)return;
      const now=voice.currentTime,osc=voice.createOscillator(),filter=voice.createBiquadFilter(),gain=voice.createGain(),pitch=p.pitch*(1+Math.sin(voiceCount++*2.3)*.06);
      osc.type=p.job==='dog'?'triangle':'sawtooth';osc.frequency.setValueAtTime(pitch,now);osc.frequency.exponentialRampToValueAtTime(pitch*.91,now+.045);
      filter.type='lowpass';filter.frequency.value=p.pitch*7;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(settings.sfxVolume*.12,now+.005);gain.gain.exponentialRampToValueAtTime(.0001,now+.048);
      osc.connect(filter);filter.connect(gain);gain.connect(voice.destination);osc.start(now);osc.stop(now+.052);osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();};
    }
    const worldPoint=(p,world)=>({x:p.x*world.width,y:p.y*world.height});
    function pause(p){p.target=null;p.walking=false;p.phase=0;p.wait=2+Math.random()*3.5;}
    function sameRegion(a,b){return config.region(a)===config.region(b);}
    function facing(a,b){return Math.abs(b.x-a.x)>Math.abs(b.y-a.y)?(b.x<a.x?'left':'right'):(b.y<a.y?'up':'down');}
    function request(p){if(active||api.blocked()||!api.ready())return;
      const {world,player}=api.state(),playerN={x:player.x/world.width,y:player.y/world.height};if(!sameRegion(playerN,p))return;
      unlock();api.stop();pause(p);const origin=worldPoint(p,world),r=player.radius;
      const choices=Array.from({length:12},(_,i)=>({x:origin.x+Math.sin(i*Math.PI/6)*r*2.8,y:origin.y+Math.cos(i*Math.PI/6)*r*2.8})).filter(q=>api.canWalk(origin,q)&&!collides(q.x,q.y,p.id));
      choices.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
      if(!choices.length)return;pending=p;approachTarget={x:choices[0].x/world.width,y:choices[0].y/world.height};api.navigate(choices[0].x,choices[0].y);
    }
    function start(p){api.stop();pause(p);pending=null;active=p;letters=0;elapsed=0;complete=false;
      const {world,player}=api.state();p.facing=facing(worldPoint(p,world),player);api.face(worldPoint(p,world));
      p.message=p.lines[p.talks++%p.lines.length];speaker.textContent=p.name;portrait.src=`villager-${p.atlas}-${p.row}.png`;portrait.alt=p.name;text.textContent='';announcement.textContent='';
      advance.setAttribute('aria-disabled','true');dialogue.classList.remove('complete');dialogue.classList.add('open');api.stage.classList.add('story-active');advance.focus({preventScroll:true});
    }
    advance.addEventListener('click',()=>{unlock();if(!complete||!active)return;const p=active;active=null;pause(p);dialogue.classList.remove('open','complete');api.stage.classList.remove('story-active');buttons[people.indexOf(p)].focus({preventScroll:true});});
    dialogue.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();advance.focus({preventScroll:true});}});
    function collides(x,y,ignore){const {world,player}=api.state();return people.some(p=>p.id!==ignore&&Math.hypot((x-p.x*world.width)/(player.radius*1.05),(y-p.y*world.height)/(player.radius*.48))<1);}
    function chooseTarget(p){const {world,player}=api.state(),from=worldPoint(p,world),r=player.radius;
      if(p.job==='delivery'){
        const route=config.deliveryRoute;if(p.route===route.length-1)p.reverse=true;if(p.route===0)p.reverse=false;p.route+=p.reverse?-1:1;
        const to=route[p.route];if(api.canWalk(from,worldPoint(to,world))){p.target={...to};return;}
      }
      if(p.job==='dog'&&Math.hypot((p.x-p.home.x)*world.width,(p.y-p.home.y)*world.height)>r){if(api.canWalk(from,worldPoint(p.home,world))){p.target={...p.home};return;}}
      for(let i=0;i<12;i++){
        const a=Math.random()*Math.PI*2,d=r*(2+Math.random()*4),to={x:p.x+Math.cos(a)*d/world.width,y:p.y+Math.sin(a)*d/world.height};
        const roaming=['letter','wave','bread','knit'].includes(p.job)?r*13:r*5;
        if(Math.hypot((to.x-p.home.x)*world.width,(to.y-p.home.y)*world.height)>roaming)continue;
        const target=worldPoint(to,world);
        if(sameRegion(p,to)&&api.canWalk(from,target)&&!collides(target.x,target.y,p.id)&&Math.hypot(target.x-player.x,target.y-player.y)>r*2.5){p.target=to;return;}
      }
      p.wait=1.5;
    }
    function patrol(p,dt){if(pending===p||api.blocked()||document.hidden||!api.ready()){p.walking=false;return;}
      const {world,player}=api.state(),r=player.radius;p.clock+=dt;
      if(!p.target){p.walking=false;p.wait-=dt;if(p.wait>0)return;chooseTarget(p);if(!p.target)return;}
      const from=worldPoint(p,world),to=worldPoint(p.target,world),dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy),travel=Math.min(d,r*(p.job==='delivery'?1.8:1.3)*dt);
      if(d<.01){pause(p);return;}
      const next={x:from.x+dx/d*travel,y:from.y+dy/d*travel},sep=Math.hypot(next.x-player.x,next.y-player.y);
      if(!api.canWalk(from,next)||collides(next.x,next.y,p.id)||(sep<r*2.1&&sep<Math.hypot(from.x-player.x,from.y-player.y))){pause(p);return;}
      p.x=next.x/world.width;p.y=next.y/world.height;p.facing=facing(from,to);p.walking=true;p.phase=(p.phase+travel/(r*2.1))%1;
      if(travel>=d-.001)pause(p);
    }
    function update(dt){const {world,player,camera,view}=api.state(),r=player.radius;people.forEach(p=>patrol(p,dt));
      layer.hidden=!api.ready()||!!active||api.blocked();
      people.forEach((p,i)=>{const b=buttons[i],x=p.x*world.width-camera.x,y=p.y*world.height-camera.y,h=r*p.size,w=r*(p.size<4?3:2.8);
        b.hidden=x< -w||x>view.width+w||y<0||y-h>view.height||!sameRegion(p,{x:player.x/world.width,y:player.y/world.height});
        b.style.transform=`translate(${x-w/2}px,${y-h*.9}px)`;b.style.width=`${w}px`;b.style.height=`${h*.9}px`;b.style.zIndex=Math.round(y);});
      if(pending&&!api.blocked()){const q=worldPoint(approachTarget,world);if(Math.hypot(player.x-q.x,player.y-q.y)<r*.9)start(pending);}
      if(active&&!complete&&!document.hidden){elapsed+=dt;while(elapsed>=.045&&letters<active.message.length){elapsed-=.045;const char=active.message[letters++];if(/[\p{L}\p{N}]/u.test(char))blip(active);}text.textContent=active.message.slice(0,letters);if(letters===active.message.length){complete=true;advance.setAttribute('aria-disabled','false');dialogue.classList.add('complete');announcement.textContent=`${active.name}: ${active.message}`;}}
    }
    function action(p){return !p.walking&&active!==p&&pending!==p&&p.clock%7<2.3&&(p.job!=='dog'||Math.hypot(p.x-p.home.x,p.y-p.home.y)<.003);}
    function drawActor(ctx,p){const {world,player}=api.state(),r=player.radius,image=sheets[p.atlas];if(!image.complete||!image.naturalWidth)return;
      const x=p.x*world.width,y=p.y*world.height,h=r*p.size,acting=action(p),side=p.facing==='left'||p.facing==='right';let col=0,flip=false;
      if(acting)col=5;else if(side){col=p.walking?2+Math.floor(p.phase*2):2;flip=p.sideRight?p.facing==='left':p.facing==='right';}else if(p.facing==='up'){col=4;flip=p.walking&&p.phase>.5;}else{col=p.walking?Math.floor(p.phase*2):0;}
      ctx.save();ctx.fillStyle='rgba(32,41,25,.22)';ctx.beginPath();ctx.ellipse(x,y+r*.1,r*.65,r*.23,0,0,Math.PI*2);ctx.fill();
      const breath=p.walking?0:Math.sin(p.clock*2.1)*.016;
      ctx.translate(x,y);ctx.scale((flip?-1:1)*(1-breath*.25),1+breath);
      if(acting&&p.job!=='dog'&&p.job!=='pig')ctx.rotate(Math.sin(p.clock*5)*.012);
      ctx.drawImage(image,col*256,p.row*256,256,256,-h/2,-h*.9375,h,h);ctx.restore();
      if(p.job==='kite'&&!p.walking)drawKite(ctx,x,y,r,p.clock);
      if(acting&&p.job==='dog'){ctx.save();ctx.fillStyle='#e3cd7780';for(let i=0;i<6;i++){const t=(p.clock*2+i/6)%1;ctx.beginPath();ctx.ellipse(x+r*.65+t*r*.85,y-r*.7+t*t*r*.75,r*.025,r*.04,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
    }
    function drawKite(ctx,x,y,r,t){const kx=x+r*(2.2+Math.sin(t*.8)*.5),ky=y-r*(8.5+Math.sin(t)*.3);ctx.save();ctx.strokeStyle='#ece6c9';ctx.lineWidth=Math.max(1,r*.022);ctx.beginPath();ctx.moveTo(x+r*.2,y-r*1.8);ctx.quadraticCurveTo(x+r*2,y-r*4,kx,ky+r*.6);ctx.stroke();
      ctx.translate(kx,ky);ctx.rotate(Math.sin(t*.8)*.13);const corners=[[0,-r],[-r*.65,0],[0,r*.75],[r*.65,0]],colors=['#ef6263','#ffcf53','#349ab7','#78b977'];for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(...corners[i]);ctx.lineTo(...corners[(i+1)%4]);ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();}ctx.restore();}
    function drawAmbient(ctx){const {world}=api.state(),sx=world.width/1448,sy=world.height/1086,t=performance.now()/1000;
      ctx.save();ctx.translate(850*sx,493*sy);ctx.beginPath();ctx.ellipse(0,0,52*sx,24*sy,0,0,Math.PI*2);ctx.clip();ctx.lineWidth=Math.max(1,sx*.7);for(let i=0;i<4;i++){const f=(t*.34+i/4)%1;ctx.strokeStyle=`rgba(225,254,255,${(1-f)*.5})`;ctx.beginPath();ctx.ellipse(0,0,f*56*sx,f*27*sy,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
    }
    return {update,drawActor,drawAmbient,actors:()=>people,collides,cancelPending:()=>{pending=null;approachTarget=null;},
      state:()=>({active:active?.id||null,pending:pending?.id||null,people:people.map(p=>({id:p.id,x:p.x,y:p.y,walking:p.walking,facing:p.facing,action:action(p),job:p.job}))})};
  }
  return {create};
})();
