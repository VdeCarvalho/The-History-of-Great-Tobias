window.TobiasStory = (() => {
  function create(api) {
    const progressKey='tobias_progress_mother_love';
    let heard=false;try{heard=localStorage.getItem(progressKey)==='1';}catch{}
    let pending=null, pendingTarget=null, lines=[], index=0, count=0, elapsed=0, active=false, complete=false, conversation=null;
    let callCount=0,callElapsed=0,voice=null,voiceCount=0;
    const mother=new Image();mother.src='mother_walk.png';
    const mom={...TobiasFamily.mother,facing:'down',walking:false,phase:0,wait:2.5,target:null};
    function approach(){const {world,player}=api.state(),from={x:mom.x*world.width,y:mom.y*world.height};
      const choices=Array.from({length:8},(_,i)=>({x:from.x+Math.sin(i*Math.PI/4)*player.radius*3.8,y:from.y+Math.cos(i*Math.PI/4)*player.radius*3.8})).filter(to=>api.canWalk(from,to));
      const score=p=>Math.hypot(p.x-player.x,p.y-player.y)+(p.y<from.y-player.radius*.25?player.radius*4:0);
      choices.sort((a,b)=>score(a)-score(b));return choices[0]||{x:player.x,y:player.y};}
    function pauseMother(){mom.walking=false;mom.phase=0;mom.target=null;mom.wait=2+Math.random()*3;}
    function patrol(dt){
      const {world,player}=api.state(),r=player.radius;
      if(!api.ready()||api.blocked()||pending||document.hidden){mom.walking=false;return;}
      if(!mom.target){mom.walking=false;mom.wait-=dt;if(mom.wait>0)return;
        for(let i=0;i<12;i++){const angle=Math.random()*Math.PI*2,distance=r*(2.5+Math.random()*4);
          const target={x:Math.max(.10,Math.min(.90,mom.x+Math.cos(angle)*distance/world.width)),y:Math.max(.24,Math.min(.83,mom.y+Math.sin(angle)*distance/world.height))};
          const from={x:mom.x*world.width,y:mom.y*world.height},to={x:target.x*world.width,y:target.y*world.height};
          if(Math.hypot(to.x-from.x,to.y-from.y)>r*1.5&&api.canWalk(from,to)){mom.target=target;break;}
        }
        if(!mom.target){mom.wait=1.5;return;}
      }
      const from={x:mom.x*world.width,y:mom.y*world.height},dx=mom.target.x*world.width-from.x,dy=mom.target.y*world.height-from.y,d=Math.hypot(dx,dy),travel=Math.min(d,r*1.55*dt);
      if(d<.01){pauseMother();return;}
      const next={x:from.x+dx/d*travel,y:from.y+dy/d*travel},separation=Math.hypot(next.x-player.x,next.y-player.y);
      // Yield to Tobias instead of entering his foot collider or pushing him aside.
      if(!api.canWalk(from,next)||(separation<r*2.3&&separation<Math.hypot(from.x-player.x,from.y-player.y))){pauseMother();return;}
      mom.x=next.x/world.width;mom.y=next.y/world.height;mom.walking=true;mom.phase=(mom.phase+travel/(r*1.8))%1;
      mom.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
      if(travel>=d-.001)pauseMother();
    }
    const layer=document.createElement('div');layer.className='story-world-ui';
    const momButton=document.createElement('button');momButton.type='button';momButton.id='motherInteract';momButton.className='world-interact mother-interact';momButton.setAttribute('aria-label','Conversar com a mãe');
    const marker=document.createElement('span');marker.className='npc-important';marker.textContent='!';marker.setAttribute('aria-hidden','true');
    const call=document.createElement('span');call.className='npc-call';call.setAttribute('aria-hidden','true');
    marker.hidden=heard;call.hidden=heard;layer.hidden=true;
    momButton.append(marker,call);
    const potButton=document.createElement('button');potButton.type='button';potButton.id='potInteract';potButton.className='world-interact pot-interact';potButton.setAttribute('aria-label','Examinar panela');potButton.title='Panela';
    layer.append(momButton,potButton);api.stage.append(layer);
    const dialogue=document.createElement('section');dialogue.id='storyDialogue';dialogue.className='story-dialogue';dialogue.setAttribute('role','dialog');dialogue.setAttribute('aria-modal','true');dialogue.setAttribute('aria-label','Conversa');
    dialogue.innerHTML='<button type="button" class="story-advance" aria-label="Avançar diálogo"><img class="story-portrait" alt=""><span class="story-copy"><strong class="story-speaker"></strong><span class="story-text" aria-hidden="true"></span></span><span class="story-arrow" aria-hidden="true">▾</span></button><span class="story-announcement" role="status" aria-live="polite"></span>';
    api.stage.append(dialogue);
    const advance=dialogue.querySelector('button'),portrait=dialogue.querySelector('img'),speaker=dialogue.querySelector('strong'),text=dialogue.querySelector('.story-text'),announcement=dialogue.querySelector('.story-announcement');
    function unlockVoice(){try{voice ||= new (window.AudioContext||window.webkitAudioContext)();if(voice.state==='suspended')voice.resume().catch(()=>{});}catch{}}
    document.addEventListener('pointerdown',unlockVoice,{once:true,capture:true});
    document.addEventListener('keydown',unlockVoice,{once:true,capture:true});
    function blip(who) {
      const settings=api.audio();if(!voice||voice.state!=='running'||settings.sfxMuted||!settings.sfxVolume)return;
      const now=voice.currentTime,osc=voice.createOscillator(),gain=voice.createGain(),filter=voice.createBiquadFilter(),formant=voice.createBiquadFilter();
      const pitch=(who==='Mãe'?225:335)*(1+Math.sin(voiceCount++*2.3)*.06);
      osc.type='sawtooth';osc.frequency.setValueAtTime(pitch,now);osc.frequency.exponentialRampToValueAtTime(pitch*.93,now+.047);
      filter.type='lowpass';filter.frequency.value=who==='Mãe'?1800:2400;
      formant.type='peaking';formant.frequency.value=who==='Mãe'?750:1100;formant.Q.value=1.5;formant.gain.value=7;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(settings.sfxVolume*.12,now+.005);gain.gain.exponentialRampToValueAtTime(.0001,now+.048);
      osc.connect(filter);filter.connect(formant);formant.connect(gain);gain.connect(voice.destination);osc.start(now);osc.stop(now+.052);
      osc.onended=()=>{osc.disconnect();filter.disconnect();formant.disconnect();gain.disconnect();};
    }
    function showLine(){count=0;elapsed=0;complete=false;text.textContent='';announcement.textContent='';const line=lines[index];speaker.textContent=line.who;portrait.src=line.who==='Mãe'?'mother_portrait.png':'tobias_portrait.png';portrait.alt=line.who;advance.setAttribute('aria-disabled','true');dialogue.classList.remove('complete');}
    function start(kind){api.stop();pauseMother();pending=null;conversation=kind;index=0;active=true;
      const {world,player}=api.state();
      if(kind==='mother'){const dx=player.x-mom.x*world.width,dy=player.y-mom.y*world.height;mom.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');api.face({x:mom.x*world.width,y:mom.y*world.height});}
      else api.face({x:TobiasFamily.pot.x*world.width,y:TobiasFamily.pot.y*world.height});
      lines=kind==='mother'?[{who:'Tobias',text:'o que foi mãe?'},{who:'Mãe',text:'so queria te dizer que te amo'},{who:'Tobias',text:'eu também mãe'}]:[{who:'Tobias',text:'isso é uma panela'}];
      dialogue.classList.add('open');api.stage.classList.add('story-active');showLine();advance.focus({preventScroll:true});
    }
    function request(kind){if(active||api.blocked()||!api.ready())return;unlockVoice();api.stop();pauseMother();pending=kind;const {world}=api.state();const target=kind==='mother'?approach():{x:TobiasFamily.pot.approachX*world.width,y:TobiasFamily.pot.approachY*world.height};pendingTarget={x:target.x/world.width,y:target.y/world.height};api.navigate(target.x,target.y);}
    momButton.addEventListener('click',()=>request('mother'));potButton.addEventListener('click',()=>request('pot'));
    advance.addEventListener('click',()=>{unlockVoice();if(!complete)return;if(index+1<lines.length){index++;showLine();return;}active=false;dialogue.classList.remove('open','complete');api.stage.classList.remove('story-active');pauseMother();
      if(conversation==='mother'){heard=true;try{localStorage.setItem(progressKey,'1');}catch{}}
      (conversation==='mother'?momButton:potButton).focus({preventScroll:true});
    });
    dialogue.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();advance.focus({preventScroll:true});}});
    function place(button,x,y,w,h){const {world,camera}=api.state();button.style.left=`${x*world.width-camera.x-w/2}px`;button.style.top=`${y*world.height-camera.y-h}px`;button.style.width=`${w}px`;button.style.height=`${h}px`;}
    function update(dt){patrol(dt);const {world,player}=api.state(),r=player.radius;place(momButton,mom.x,mom.y,r*3,r*5.5);place(potButton,TobiasFamily.pot.x,TobiasFamily.pot.y+.026,r*2.5,r*2);
      layer.hidden=!api.ready()||active||api.blocked();marker.hidden=heard;call.hidden=heard;
      if(!heard&&!document.hidden){callElapsed+=dt;if(callElapsed>.14){callElapsed=0;callCount=Math.min(8,callCount+1);call.textContent='filho...'.slice(0,callCount);}}
      if(pending&&!api.blocked()){const target={x:pendingTarget.x*world.width,y:pendingTarget.y*world.height};if(Math.hypot(player.x-target.x,player.y-target.y)<r*.9)start(pending);}
      if(active&&!complete&&!document.hidden){elapsed+=dt;const line=lines[index];while(elapsed>=.045&&count<line.text.length){elapsed-=.045;const char=line.text[count++];text.textContent=line.text.slice(0,count);if(/[\p{L}\p{N}]/u.test(char))blip(line.who);}if(count===line.text.length){complete=true;advance.setAttribute('aria-disabled','false');dialogue.classList.add('complete');announcement.textContent=`${line.who}: ${line.text}`;}}
    }
    function draw(ctx){if(!mother.complete||!mother.naturalWidth)return;const {world,player}=api.state(),r=player.radius,x=mom.x*world.width,y=mom.y*world.height,h=r*6.4,w=h,cell=mother.naturalWidth/4,row={down:0,right:1,left:2,up:3}[mom.facing],column=mom.walking?Math.floor(mom.phase*4):0;
      ctx.save();ctx.fillStyle='rgba(45,31,21,.22)';ctx.beginPath();ctx.ellipse(x,y+r*.1,r*.85,r*.25,0,0,Math.PI*2);ctx.fill();
      const breath=mom.walking?0:Math.sin(performance.now()/680+1.2)*.018;
      ctx.translate(x,y);ctx.scale(1-breath*.28,1+breath);ctx.drawImage(mother,column*cell,row*cell,cell,cell,-w/2,-h*.94,w,h);ctx.restore();}
    return {update,draw,motherPosition:()=>({x:mom.x,y:mom.y}),state:()=>({...mom,active,pending}),cancelPending:()=>{pending=null;}};
  }
  return {create};
})();
