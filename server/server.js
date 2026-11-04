import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { randomBytes } from 'node:crypto';

const app = express();
app.get('/', (_req,res)=>res.json({name:'FORSAKEN 2D realtime server',status:'online',protocol:1}));
app.get('/health', (_req,res)=>res.json({ok:true,rooms:rooms.size}));
const server = http.createServer(app);
const allowedOrigins=process.env.CORS_ORIGIN?process.env.CORS_ORIGIN.split(',').map(x=>x.trim()):'*';
const io = new Server(server,{cors:{origin:allowedOrigins,methods:['GET','POST']},pingInterval:20000,pingTimeout:10000,maxHttpBufferSize:1e5});
const rooms = new Map();
const MAX_PLAYERS=9, ROUND_SECONDS=240;
const mapData={yard:{gens:[[80,120],[450,110],[850,500],[150,500],[820,240]]},hotel:{gens:[[75,500],[470,190],[870,90],[530,520],[850,350]]},facility:{gens:[[70,500],[400,145],[850,180],[490,510],[800,500]]}};
const code=()=>randomBytes(3).toString('hex').toUpperCase();
function publicPlayers(room){return [...room.players.values()].map(p=>({id:p.id,name:p.name,character:p.character,ready:p.ready,role:p.role,x:p.x,y:p.y,captured:p.captured}));}
function emitRoom(room){io.to(room.code).emit('room:update',{players:publicPlayers(room)});}
function endRoom(room,winner,reason){if(room.ended)return;room.ended=true;for(const p of room.players.values()){const coins=(winner==='survivors'&&p.role==='survivor')||(winner==='killer'&&p.role==='killer')?40:15;io.to(p.id).emit('player:reward',{coins,won:((winner==='survivors'&&p.role==='survivor')||(winner==='killer'&&p.role==='killer')),reason:'resultado de ronda'});}io.to(room.code).emit('match:end',{winner,reason});clearInterval(room.timer);room.timer=null;}
function startRoom(room){if(room.started||room.players.size<2)return;room.started=true;room.ended=false;room.time=ROUND_SECONDS;room.lms=false;room.mapKey=['yard','hotel','facility'][Math.floor(Math.random()*3)];room.gens=mapData[room.mapKey].gens.map((p,id)=>({id,x:p[0],y:p[1],progress:0,done:false}));let i=0;for(const p of room.players.values()){p.role=i++===0?'killer':'survivor';p.x=p.role==='killer'?870:70;p.y=p.role==='killer'?520:70;p.captured=false;p.stun=0;}
  io.to(room.code).emit('match:start',{players:publicPlayers(room),mapKey:room.mapKey,gens:room.gens,time:room.time});
  room.timer=setInterval(()=>{if(room.ended)return;const living=[...room.players.values()].filter(p=>p.role==='survivor'&&!p.captured);if(living.length===1&&!room.lms){room.lms=true;room.time=Math.min(room.time,74);}room.time=Math.max(0,room.time-1);io.to(room.code).emit('match:tick',{time:room.time,lms:room.lms,lmsKey:living.length===1?`${living[0].character||'default'}-${[...room.players.values()].find(p=>p.role==='killer')?.character||'default'}`:'default'});if(!living.length)endRoom(room,'killer','El asesino capturó a todo el equipo.');else if(room.time<=0)endRoom(room,'survivors','Los supervivientes resistieron hasta que terminó el tiempo.');},1000);
}
io.on('connection',socket=>{
  socket.on('room:join',({name,roomCode,character}={})=>{
    let room=roomCode?rooms.get(String(roomCode).toUpperCase()):null;
    if(roomCode&&!room){socket.emit('room:error','No existe esa sala.');return;}
    if(!room){let id=code();while(rooms.has(id))id=code();room={code:id,players:new Map(),started:false,ended:false,timer:null};rooms.set(id,room);}
    if(room.started||room.players.size>=MAX_PLAYERS){socket.emit('room:error','La sala está llena o la ronda ya comenzó.');return;}
    socket.join(room.code);room.players.set(socket.id,{id:socket.id,name:String(name||'Jugador').slice(0,18),character:String(character||'noob').slice(0,32),ready:false,role:null,x:70,y:70,captured:false});socket.data.room=room.code;
    socket.emit('room:joined',{roomCode:room.code,players:publicPlayers(room)});emitRoom(room);
  });
  socket.on('room:ready',({ready}={})=>{const room=rooms.get(socket.data.room);if(!room||room.started)return;const p=room.players.get(socket.id);if(!p)return;p.ready=!!ready;emitRoom(room);if(room.players.size>=2&&[...room.players.values()].every(x=>x.ready))startRoom(room);});
  socket.on('player:update',data=>{const room=rooms.get(socket.data.room);if(!room||!room.started||room.ended)return;const p=room.players.get(socket.id);if(!p||p.captured)return;const nx=Math.max(24,Math.min(936,Number(data?.x)||p.x)),ny=Math.max(24,Math.min(576,Number(data?.y)||p.y));const now=Date.now(),elapsed=Math.max(.05,Math.min(.25,(now-(p.lastMove||now-100))/1000));const distance=Math.hypot(nx-p.x,ny-p.y);if(distance>260*elapsed+12)return;p.x=nx;p.y=ny;p.lastMove=now;io.to(room.code).except(socket.id).emit('player:update',{id:p.id,x:p.x,y:p.y,role:p.role,name:p.name});});
  socket.on('objective:progress',data=>{const room=rooms.get(socket.data.room);if(!room||!room.started||room.ended)return;const p=room.players.get(socket.id);if(!p||p.role!=='survivor')return;const g=room.gens?.[Number(data?.id)];if(!g||g.done||Math.hypot(p.x-g.x,p.y-g.y)>62)return;g.progress=Math.min(100,g.progress+100);g.done=!!data.done||g.progress>=100;io.to(room.code).emit('objective:update',g);if(room.gens.every(x=>x.done))endRoom(room,'survivors','El equipo completó los generadores.');});
  socket.on('player:tag',({targetId}={})=>{const room=rooms.get(socket.data.room);if(!room||!room.started||room.ended)return;const killer=room.players.get(socket.id),target=room.players.get(targetId);if(!killer||killer.role!=='killer'||!target||target.role!=='survivor'||target.captured)return;const now=Date.now();if(now-(killer.lastTag||0)<1200)return;if(Math.hypot(killer.x-target.x,killer.y-target.y)>48)return;killer.lastTag=now;target.captured=true;io.to(room.code).emit('player:captured',{id:target.id});if([...room.players.values()].filter(p=>p.role==='survivor'&&!p.captured).length===0)endRoom(room,'killer','El asesino capturó a todo el equipo.');});
  socket.on('killer:power',({targetId,power}={})=>{const room=rooms.get(socket.data.room);if(!room||!room.started||room.ended)return;const killer=room.players.get(socket.id),target=room.players.get(targetId);if(!killer||killer.role!=='killer'||!target||target.role!=='survivor'||target.captured)return;const now=Date.now();if(now-(killer.lastPower||0)<5000)return;if(Math.hypot(killer.x-target.x,killer.y-target.y)>150)return;killer.lastPower=now;io.to(target.id).emit('player:power-hit',{power:String(power||'pulse')});});
  socket.on('match:finish',({winner}={})=>{const room=rooms.get(socket.data.room);if(!room||!room.started||room.ended)return;const p=room.players.get(socket.id);if(p?.role==='killer'&&winner==='killer')endRoom(room,'killer','El asesino terminó la ronda.');});
  socket.on('disconnect',()=>{const room=rooms.get(socket.data.room);if(!room)return;room.players.delete(socket.id);if(!room.started){if(!room.players.size){clearInterval(room.timer);rooms.delete(room.code);}else emitRoom(room);}else if(!room.ended&&room.players.size<2)endRoom(room,'survivors','No quedan suficientes jugadores conectados.');});
});
process.on('unhandledRejection',error=>console.error('Unhandled rejection:',error));
const port=Number(process.env.PORT||3000);server.listen(port,'0.0.0.0',()=>console.log(`FORSAKEN 2D server listening on ${port}`));
