import io from 'socket.io-client';

const socket = io(process.env.LIVE_QUERY_URL);

class liveDB {
  constructor() {
    this.keys = {};
    this.subscriber_id = null;
    //this.className = null;
  }
  
  setSubscriberId(subscriber_id) {
    this.subscriber_id = subscriber_id;
  }
  
  startWatch(key, className, params, callback) {
    if (this.keys[className] && this.keys[className] != key) {
      this.stopWatch(className);
    }
    if (!this.keys[className] || this.keys[className] !== key) {
      this.keys[className] = key;
      //this.className = className;

      socket.emit('start-watch', {class: className, params: params, key: key, subscriber: this.subscriber_id});

      socket.on('data-change-' + key, (data) => {
        //console.log(data);
        callback.call(this, data);
      });
      socket.on('stop-watch-all-' + key, (data) => {
        this.stopWatch(data.class);
      });
      socket.on('connect_error', (data) => {
        console.log('connect_error')
        socket.close();
      })
    }
  }
  
  stopWatch(className) {
    if (this.keys[className]) {
      //console.log(socket)
      socket.emit('stop-watch', {class: className, key: this.keys[className], subscriber: this.subscriber_id});
      //socket.close();
    }
  }
  
  stopWatchAll() {
    for (var k in this.keys) {
      socket.emit('stop-watch', {class: k, key: this.keys[k], subscriber: this.subscriber_id});
    }
  }
  
  onBookReimport() {
    if (this.keys['blockV']) {
      socket.emit('stop-watch-all', {class: 'blockV', key: this.keys['blockV']});
      this.stopWatch('blockV');
    }
  }
}

export {
  liveDB
}