(() => {
  const light=document.createElement('canvas');light.width=512;light.height=768;
  const g=light.getContext('2d');
  let mask=null;
  const panes=[[[41,190],[56,250],[46,335],[25,379]],[[26,617],[39,654],[28,765],[13,810]]];
  function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
  window.TobiasAtmosphere={draw(ctx,image,maskImage,w,h,t){
    ctx.save();ctx.scale(w/1024,h/1536);
    // Only the outdoor pixels sway. Window frames and the room art remain fixed.
    for(const points of panes){ctx.save();polygon(ctx,points);ctx.clip();const dx=Math.sin(t*.85)*5,dy=Math.sin(t*.57)*3;ctx.drawImage(image,dx,dy,1024,1536);
      const cy=points[0][1]+((t*.22)%1)*240-50;
      const glint=ctx.createLinearGradient(0,cy-45,90,cy+45);glint.addColorStop(0,'rgba(255,250,219,0)');glint.addColorStop(.5,'rgba(255,250,219,.7)');glint.addColorStop(1,'rgba(255,250,219,0)');ctx.fillStyle=glint;ctx.fillRect(0,points[0][1]-70,110,320);ctx.restore();}
    if(!mask&&maskImage.complete&&maskImage.naturalWidth){mask=document.createElement('canvas');mask.width=512;mask.height=768;const m=mask.getContext('2d');m.drawImage(maskImage,0,0,512,768);const d=m.getImageData(0,0,512,768);for(let i=0;i<d.data.length;i+=4)d.data[i+3]=d.data[i];m.putImageData(d,0,0);}
    g.clearRect(0,0,512,768);g.save();g.scale(.5,.5);
    for(const y of [350,820]){
      const sway=Math.sin(t*.7+y)*42;
      const strength=.28+.17*Math.sin(t*1.05+y);
      const sun=g.createLinearGradient(90,y,610,y+600);sun.addColorStop(0,`rgba(255,235,157,${strength})`);sun.addColorStop(.6,`rgba(255,235,157,${strength*.7})`);sun.addColorStop(1,'rgba(255,231,152,0)');g.fillStyle=sun;
      polygon(g,[[90,y],[153,y],[680+sway,y+640],[385+sway,y+640]]);g.fill();
      g.save();g.filter='blur(3px)';g.fillStyle='rgba(36,49,28,.18)';g.strokeStyle='rgba(36,49,28,.12)';
      const random=n=>{const v=Math.sin(n*127.1+19.7)*43758.5453;return v-Math.floor(v);};
      for(let i=0;i<9;i++){
        const cx=130+random(i*3)*340+Math.sin(t*.8+i)*19,cy=y+45+random(i*3+1)*520+Math.cos(t*.7+i)*14;
        g.lineWidth=2+random(i)*3;g.beginPath();g.moveTo(88,y+random(i+51)*100);g.quadraticCurveTo(cx-80,cy-30,cx,cy);g.stroke();
        for(let j=0;j<7;j++){const seed=i*11+j,angle=random(seed+80)*Math.PI*2,x=cx+Math.cos(angle)*random(seed+10)*48,yy=cy+Math.sin(angle)*random(seed+20)*38;
          g.save();g.translate(x,yy);g.rotate(angle+Math.sin(t*.9+seed)*.15);const size=10+random(seed+30)*15;g.beginPath();g.moveTo(-size,0);g.bezierCurveTo(-size*.2,-size*.65,size*.7,-size*.25,size,0);g.bezierCurveTo(size*.25,size*.55,-size*.4,size*.4,-size,0);g.fill();g.restore();}
      }g.restore();
    }
    g.restore();if(mask){g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);g.globalCompositeOperation='source-over';}
    ctx.drawImage(light,0,0,1024,1536);
    for(let i=0;i<40;i++){const x=110+(i*43)%450+Math.sin(t*.55+i)*18,y=390+((i*79+t*9)%820);ctx.globalAlpha=.30+Math.sin(t*.7+i)*.17;ctx.fillStyle='#fff2c5';ctx.beginPath();ctx.arc(x,y,i%3===0?2:1.4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }};
})();
