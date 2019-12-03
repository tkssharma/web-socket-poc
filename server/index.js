const http = require('http');
const io = require('socket.io')();
const socketAuth = require('socketio-auth');
const events = require('events');
var eventEmitter = new events.EventEmitter();

eventEmitter.on('sendTrigger', function(){
  // loop on global store and send message to all IDs
  // lets say we are sendinhg message to ASIA and HI Users 
  const users = globalStorage['ASIA']['HI'].users ;
  console.log(users);
  users.forEach(element => {
        io.to(`${element.id}`).emit('message', 'sending only to HI/ASIA Users');
  });
});

const PORT = process.env.PORT || 9000;
const server = http.createServer();
const globalStorage = { 
  ASIA : {
      HI: {
           users :[]
      },
      EN:{
        users :[]
      }
  },
  EU: {
      HI:{
        users :[]
      },
      EN:{
        users :[]
      }
  }
};

io.attach(server);
// dummy user verification
async function verifyUser (language, region, uuid, id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = [
        {
          language: 'HI',
          region: 'ASIA',
        },
        {
          language: 'HI',
          region: 'EU',
        },
        {
          language: 'EN',
          region: 'ASIA',
        },
        {
          language: 'EN',
          region: 'EU',
        },
      ];
      const user = users.filter((user) => user.language === language && user.region === region)
       || [];
      if (user.length === 0) {
        console.log('reject');
        return reject('data not coming as expected for register event');
      }
      user[0].uuid = uuid;
      user[0].id = id;
      return resolve(user[0]);
    }, 200);
  });
}
async function StorageData(meta){
  const { language, region, uuid } = meta;
   const users = globalStorage[region][language].users || [];
   if(users && users.length > 0){
      const isNewUser = users.filter(i => {
        return i.uuid === uuid
      });
      if(isNewUser.length === 0){
        users.push(meta);
        globalStorage[region][language].users = users;
        return true;
      }
      return false;
   } else {
      users.push(meta);
      globalStorage[region][language].users =  users;
    return true;
   }
}

socketAuth(io, {
  authenticate: async (socket, data, callback) => {
    const { language, region, uuid } = data;
    try {
      const id = socket.id;
      const user = await verifyUser(language, region, uuid, id);
      const canConnect = await StorageData({
        language, region, uuid, id
      });
      console.log(globalStorage);
      if (!canConnect) {
        console.log('already logged In');
        return callback({ message: 'ALREADY_LOGGED_IN' });
      }
      socket.user = user;
      return callback(null, true);
    } catch (e) {
      console.log(e);
      console.log(`Socket ${socket.id} unauthorized.`);
      return callback({ message: 'UNAUTHORIZED' });
    }
  },
  postAuthenticate: async (socket) => {
    console.log(`Socket ${socket.id} authenticated.`);
    socket.on('message', async (packet) => {
      eventEmitter.emit('sendTrigger');
    });
  },
  disconnect: async (socket) => {

    console.log('removing user from registry');

    if (socket.user) {
      // delete user from array 
      if(socket.user.uuid){
        const {region, language, uuid} = socket.user;
        console.log(region, language, uuid);
        const users = globalStorage[region][language].users || [];
        const userData = users.filter(i => i.uuid !== uuid);
        console.log(userData.length);
        globalStorage[region][language].users = userData;
        console.log(globalStorage);
      }
      // 
    }
  },
})

server.listen(PORT);
