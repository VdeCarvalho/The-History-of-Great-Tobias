window.TobiasStory = (() => {
  function create(api) {
    const progressKey='tobias_progress_mother_love';
    let heard=false;try{heard=localStorage.getItem(progressKey)==='1';}catch{}
    let pending=null, lines=[], index=0, count=0, elapsed=0, active=false, complete=false, conversation=null;
    let callCount=0,callElapsed=0,voice=null,voiceCount=0;
    const mother=new Image();mother.src='mother.png';
    const layer=document.createElement('div');layer.className='story-world-ui';
    const momButton=document.createElement('button');momButton.type='button';momButton.id='motherInteract';momButton.className='world-interact mother-interact';momButton.setAttribute('aria-label','Conversar com a mãe');
    const marker=document.createElement('span');marker.className='npc-important';marker.textContent='!';marker.setAttribute('aria-hidden','true');
    const call=document.createElement('span');call.className='npc-call';call.setAttribute('aria-hidden','true');
    momButton.append(marker,call);
    const potButton=document.createElement('button');potButton.type='button';potButton.id='potInteract';potButton.className='world-interact pot-interact';potButton.setAttribute('aria-label','Examinar panela');potButton.title='Panela';
    layer.append(momButton,potButton);api.stage.append(layer);
    const dialogue=document.createElement('section');dialogue.id='storyDialogue';dialogue.className='story-dialogue';dialogue.setAttribute('role','dialog');dialogue.setAttribute('aria-modal','true');dialogue.setAttribute('aria-label','Conversa');
    dialogue.innerHTML='<button type="button" class="story-advance" aria-label="Avançar diálogo"><img class="story-portrait" alt=""><span class="story-copy"><strong class="story-speaker"></strong><span class="story-text" aria-hidden="true"></span></span><span class="story-arrow" aria-hidden="true">▾</span></button><span class="story-announcement" role="status" aria-live="polite"></span>';
    api.stage.append(dialogue);
    const advance=dialogue.querySelector('button'),portrait=dialogue.querySelector('img'),speaker=dialogue.querySelector('strong'),text=dialogue.querySelector('.story-text'),announcement=dialogue.querySelector('.story-announcement');
    function unlockVoice(){try{voice ||= new (window.AudioContext||window.webkitAudioContext)();if(voice.state==='suspended')voice.resume().catch(()=>{});}catch{}}
    function blip(who) {
      const settings=api.audio();if(!voice||voice.state!=='running'||settings.sfxMuted||!settings.sfxVolume)return;
      const now=voice.currentTime,osc=voice.createOscillator(),gain=voice.createGain(),filter=voice.createBiquadFilter();
      const pitch=(who==='Mãe'?225:335)*(1+Math.sin(voiceCount++*2.3)*.06);
      osc.type='triangle';osc.frequency.setValueAtTime(pitch,now);osc.frequency.exponentialRampToValueAtTime(pitch*.88,now+.045);
      filter.type='lowpass';filter.frequency.value=who==='Mãe'?1000:1450;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(settings.sfxVolume*.045,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.055);
      osc.connect(filter);filter.connect(gain);gain.connect(voice.destination);osc.start(now);osc.stop(now+.06);
      osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();};
    }
    function showLine(){count=0;elapsed=0;complete=false;text.textContent='';announcement.textContent='';const line=lines[index];speaker.textContent=line.who;portrait.src=line.who==='Mãe'?'mother_portrait.png':'tobias_portrait.png';portrait.alt=line.who;advance.setAttribute('aria-disabled','true');dialogue.classList.remove('complete');}
    function start(kind){api.stop();pending=null;conversation=kind;index=0;active=true;
      lines=kind==='mother'?[{who:'Tobias',text:'o que foi mãe?'},{who:'Mãe',text:'so queria te dizer que te amo'},{who:'Tobias',text:'eu também mãe'}]:[{who:'Tobias',text:'isso é uma panela'}];
      dialogue.classList.add('open');api.stage.classList.add('story-active');showLine();advance.focus({preventScroll:true});
    }
    function request(kind){if(active||api.blocked()||!api.ready())return;unlockVoice();api.stop();pending=kind;const {world,player}=api.state();const target=kind==='mother'?{x:TobiasFamily.mother.x*world.width,y:TobiasFamily.mother.y*world.height+player.radius*2}:{x:TobiasFamily.pot.approachX*world.width,y:TobiasFamily.pot.approachY*world.height};api.navigate(target.x,target.y);}
    momButton.addEventListener('click',()=>request('mother'));potButton.addEventListener('click',()=>request('pot'));
    advance.addEventListener('click',()=>{if(!complete)return;if(index+1<lines.length){index++;showLine();return;}active=false;dialogue.classList.remove('open','complete');api.stage.classList.remove('story-active');
      if(conversation==='mother'){heard=true;try{localStorage.setItem(progressKey,'1');}catch{}}
      (conversation==='mother'?momButton:potButton).focus({preventScroll:true});
    });
    dialogue.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();advance.focus({preventScroll:true});}});
    function place(button,x,y,w,h){const {world,camera}=api.state();button.style.left=`${x*world.width-camera.x-w/2}px`;button.style.top=`${y*world.height-camera.y-h}px`;button.style.width=`${w}px`;button.style.height=`${h}px`;}
    function update(dt){const {world,player,view,camera}=api.state(),r=player.radius;place(momButton,TobiasFamily.mother.x,TobiasFamily.mother.y,r*3,r*5.5);place(potButton,TobiasFamily.pot.x,TobiasFamily.pot.y+.026,r*2.5,r*2);
      layer.hidden=!api.ready()||active||api.blocked();marker.hidden=heard;call.hidden=heard;
      if(!heard&&!document.hidden){callElapsed+=dt;if(callElapsed>.14){callElapsed=0;callCount=Math.min(8,callCount+1);call.textContent='filho...'.slice(0,callCount);}}
      if(pending&&!api.blocked()){const target=pending==='mother'?{x:TobiasFamily.mother.x*world.width,y:TobiasFamily.mother.y*world.height+r*2}:{x:TobiasFamily.pot.approachX*world.width,y:TobiasFamily.pot.approachY*world.height};if(Math.hypot(player.x-target.x,player.y-target.y)<r*.9)start(pending);}
      if(active&&!complete&&!document.hidden){elapsed+=dt;const line=lines[index];while(elapsed>=.045&&count<line.text.length){elapsed-=.045;const char=line.text[count++];text.textContent=line.text.slice(0,count);if(count%2===1&&/[\p{L}\p{N}]/u.test(char))blip(line.who);}if(count===line.text.length){complete=true;advance.setAttribute('aria-disabled','false');dialogue.classList.add('complete');announcement.textContent=`${line.who}: ${line.text}`;}}
    }
    function draw(ctx){if(!mother.complete||!mother.naturalWidth)return;const {world,player}=api.state(),r=player.radius,x=TobiasFamily.mother.x*world.width,y=TobiasFamily.mother.y*world.height,h=r*5.5,w=h*mother.naturalWidth/mother.naturalHeight;
      ctx.save();ctx.fillStyle='rgba(45,31,21,.22)';ctx.beginPath();ctx.ellipse(x,y+r*.1,r*.85,r*.25,0,0,Math.PI*2);ctx.fill();ctx.drawImage(mother,x-w/2,y-h,w,h);ctx.restore();}
    return {update,draw,cancelPending:()=>{pending=null;}};
  }
  return {create};
})();
