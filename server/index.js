var ws = require("nodejs-websocket");
var moment = require('moment');

console.log("Building Conn")

let users = [];
let conns = {};
let groups = [];

function boardcast(obj) {
  console.log("boardcast");
  if(obj.bridge && obj.bridge.length){
    console.log("brideg1");
    obj.bridge.forEach(item=>{
      conns[item].sendText(JSON.stringify(obj));
    })
    return;
  }
  if (obj.groupId) {
    
    group = groups.filter(item=>{
      return item.id === obj.groupId
    })[0];
    group.users.forEach(item=>{
      console.log(item.state);
      if(item.state!="Do not disturb"){
      conns[item.uid].sendText(JSON.stringify(obj));}
    })
    return;
  }

  server.connections.forEach((conn, index) => {
    console.log(conn.frameBuffer);
      conn.sendText(JSON.stringify(obj));
  })
}

var server = ws.createServer(function(conn){
  conn.on("text", function (obj) {
    //console.log(obj);
    obj = JSON.parse(obj);
    conns[''+obj.uid+''] = conn;
    switch(obj.type){
      case 1:
        console.log("case 1");
        let isuser = users.some(item=>{
          return item.uid === obj.uid
        })
        if(!isuser){
          users.push({
            nickname: obj.nickname,
            uid: obj.uid,
            state: obj.state,
            status: 1
          });
        } else {
          users.map((item, index)=>{
            if(item.uid === obj.uid){
              item.status = 1;
            }
            return item;
          })
        }
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+' Joined this small room',
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge
        });
        break;
      case 2:
        console.log("case 2");
        users.map((item, index)=>{
          if(item.uid === obj.uid){
            item.status = 0;
          }
          return item;
        })
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+' exits this small room',
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: []
        });
        break;
      case 10:
        console.log("case 10");
        groups.push({
          id: moment().valueOf(),
          name: obj.groupName,
          users: [{
            uid: obj.uid,
            nickname: obj.nickname,
            state: obj.state
          }]
        })
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+' Created small room: ' + obj.groupName,
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge
        });
        break;
        
        //

        case 99:
        console.log("case 99");
        users.map((item, index)=>{
          if(item.uid === obj.uid){
            item.state = obj.state;
            // console.log("Changed");
            // console.log(item.state);
            // console.log("obj"+obj.state);
          }
         
        })
        groups.forEach(item=>{
          item.users.map((item, index)=>{
            if(item.uid === obj.uid){
              item.state = obj.state; 
            }
             })
        })
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+' Change state to ' + obj.state,
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge,
          state: obj.state
        });
        break;
      case 20:
        console.log("case 20");
        let group = groups.filter(item=>{
          return item.id === obj.groupId
        })[0]
        group.users.push({
          uid: obj.uid,
          nickname: obj.nickname,
          state: obj.state
        })
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+' Join this small room ' + obj.groupName,
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge
        });
        break;
      default:
        console.log("def");
        boardcast({
          type: 2,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.msg,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge,
          groupId: obj.groupId,
          state : obj.state,
          status: 1
        });
        break;
    }
  })
  conn.on("close", function (code, reason) {
    console.log("Close")
  });
  conn.on("error", function (code, reason) {
    console.log("Unsu")
  });
}).listen(8001)
console.log("WebSocket")