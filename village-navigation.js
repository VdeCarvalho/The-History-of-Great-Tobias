window.TobiasVillageNavigation = (() => {
  function create(api){
    let cached=null;
    function prepare(){const {world}=api.state(),cell=world.width/256,key=world.width+','+world.height;
      if(cached?.key===key)return cached;
      const cols=256,rows=Math.ceil(world.height/cell),grid=new PF.Grid(cols,rows);
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)grid.setWalkableAt(x,y,!api.floorCollides((x+.5)*cell,(y+.5)*cell));
      cached={key,cell,cols,rows,grid};return cached;
    }
    function find(start,target){const {grid:base,cell,cols,rows}=prepare(),grid=base.clone(),{world,player}=api.state();
      // Static floor is cached; only the twelve moving foot colliders change per request.
      for(const p of api.actors()){
        const x=p.x*world.width,y=p.y*world.height,rx=player.radius*1.05,ry=player.radius*.48;
        for(let r=Math.max(0,Math.floor((y-ry)/cell));r<=Math.min(rows-1,Math.floor((y+ry)/cell));r++)for(let c=Math.max(0,Math.floor((x-rx)/cell));c<=Math.min(cols-1,Math.floor((x+rx)/cell));c++){
          if(Math.hypot(((c+.5)*cell-x)/rx,((r+.5)*cell-y)/ry)<1)grid.setWalkableAt(c,r,false);
        }
      }
      const node=p=>[Math.max(0,Math.min(cols-1,Math.floor(p.x/cell))),Math.max(0,Math.min(rows-1,Math.floor(p.y/cell)))];
      // Connect exact feet positions to reachable grid centers without opening obstacles.
      function connectedNode(point){
        const [cx,cy]=node(point);let best=null,d=Infinity;
        for(let y=Math.max(0,cy-3);y<=Math.min(rows-1,cy+3);y++)for(let x=Math.max(0,cx-3);x<=Math.min(cols-1,cx+3);x++){
          const p={x:(x+.5)*cell,y:(y+.5)*cell},score=Math.hypot(p.x-point.x,p.y-point.y);
          if(score<d&&grid.isWalkableAt(x,y)&&api.segmentClear(point,p)){best=[x,y];d=score;}
        }return best;
      }
      const source=connectedNode(start),destination=connectedNode(target);
      if(!source||!destination)return [];
      const [sx,sy]=source,[tx,ty]=destination;
      const path=new PF.AStarFinder({diagonalMovement:PF.DiagonalMovement.OnlyWhenNoObstacles}).findPath(sx,sy,tx,ty,grid);
      if(!path.length)return [];
      const raw=path.map(([x,y])=>({x:(x+.5)*cell,y:(y+.5)*cell}));raw.push(target);
      const result=[];let anchor=start,i=0;
      while(i<raw.length){let furthest=-1,step=1,j=i;
        while(j<raw.length&&api.segmentClear(anchor,raw[j])){furthest=j;if(j===raw.length-1)break;j=Math.min(raw.length-1,i+step);step*=2;}
        if(furthest>=0&&j>furthest){let low=furthest+1,high=j-1;while(low<=high){const mid=(low+high)>>1;if(api.segmentClear(anchor,raw[mid])){furthest=mid;low=mid+1;}else high=mid-1;}}
        if(furthest<0)return [];result.push(raw[furthest]);anchor=raw[furthest];i=furthest+1;
      }return result;
    }
    return {prepare,find};
  }
  return {create};
})();
