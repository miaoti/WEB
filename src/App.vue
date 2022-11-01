<template>
  <div id="app">
    <c-dialog
      ref="loginDialog"
      title='Enter your nick name'
      confirmBtn="Start chat"
      @confirm="login"
    >
      <input class="nickname" v-model="nickname" type="text" placeholder="Enter your nick name">
    </c-dialog>

    
    <c-dialog
      ref="stateDialog"
      title='Enter your State'
      confirmBtn="OK"
      @confirm="stateIN"
    >
      <input class="nickname" v-model="state" type="text" placeholder="Enter your state">
    </c-dialog>

    <c-dialog
      ref="createGroupDialog"
      title='Enter small group name'
      confirmBtn="OK"
      @confirm="createGroup"
    >
      <input class="nickname" v-model="groupName" type="text" placeholder="Enter small group name">
    </c-dialog>

    <div class="web-im dis-flex">
      <div class="left">
        <div class="aside content">
          <div class="header">
            <div class="tabbar dis-flex">
              <label :class="{active:switchType==1, unread: usersUnRead}" for="" @click="switchType=1">Members</label>
              <label :class="{active:switchType==2, unread: groupsUnRead}" for="" @click="switchType=2">Small group</label>
            </div>
          </div>
          <div class="body user-list">
            <div v-if="switchType==2" class="user" @click="triggerGroup(item)" v-for="item in currentGroups">
              {{item.name}}
              <span class="tips-num" v-if="item.unread">{{item.unread}}</span>
              <span v-if="!checkUserIsGroup(item)" @click.stop="addGroup(item)" class="add-group">+</span>
            </div>
            <div v-if="switchType==1 && item.uid!=uid" class="user" @click="triggerPersonal(item)" :class="{offline: !item.status}" v-for="item in currentUserList">
              {{item.nickname+"       "+item.state}}
              <span class="tips-num" v-if="item.unread">{{item.unread}}</span>
            </div>
          </div>
          <div class="footer">
            <div class="func dis-flex">
              <label @click="$refs.createGroupDialog.show()">New</label>
              <label @click="$refs.stateDialog.show()">State</label>
            </div>
          </div>
        </div>
      </div>
      <div class="right content">
        <div class="header im-title">{{title}}</div>
        <div class="body im-record" id="im-record">
          <div class="ul">
            <div class="li" :class="{user: item.uid == uid}" v-for="item in currentMessage">
              <template v-if="item.type===1">
                <p class="join-tips">{{item.msg}}</p>
              </template>
              <template v-else>
                <p class="message-date">
                  <span class="m-nickname">{{item.nickname}}</span> {{item.date}}</p>
                <p class="message-box">{{item.msg}}</p>
              </template>
            </div>
          </div>
        </div>
        <div class="footer im-input dis-flex">
          <input type="text" v-model="msg" placeholder="Enter">
          <button @click="send">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import moment from 'moment'


export default {
  name: 'App',
  components: {
    'c-dialog': Vue.extend(require('@/components/dialog/index.vue').default)
  },
  data(){
    return {
      title: 'Choose',
      switchType: 1,
      uid: '',
      state:'',
      nickname: '',
      socket: '',
      msg: '',
      messageList: [],
      users: [],
      groups: [],
      groupId: '',
      bridge: [],
      groupName: ''
    }
  },
  mounted() {
    let vm = this;
    let user = localStorage.getItem('WEB_IM_USER');
    user = user && JSON.parse(user) || {};
    vm.uid = user.uid;
    vm.nickname = user.nickname;
    vm.state = user.state;

    if(!vm.uid){
      
      
      vm.$refs.loginDialog.show();

     }
    else {
      vm.conWebSocket();
    }vm.$refs.stateDialog.show();


    document.onkeydown = function (event) {
        var e = event || window.event;
        if (e && e.keyCode == 13) { 
            vm.send()
        }
    }
    window.onbeforeunload = function (e) {
      vm.socket.send(JSON.stringify({
        uid: vm.uid,
        type: 2,
        nickname: vm.nickname,
        state: vm.state,
        bridge: []
      }));
    }
  },
  computed: {
    currentMessage() {
      let vm = this;
      let data = vm.messageList.filter(item=>{
        if(item.type === 1) {
          return item;
        } else if(this.groupId) {
          return item.groupId === this.groupId
        } else if(item.bridge.length){
          return item.bridge.sort().join(',') == vm.bridge.sort().join(',')
        }
      })
      data.map(item=>{
        item.status = 0
        return item;
      })
      return data;
    },
    currentGroups() {
      let vm = this;
      vm.groups.map(group=>{
        group.unread = this.messageList.filter(item=>{
          return item.groupId === group.id && item.status === 1
        }).length
        return group;
      })
      return vm.groups;
    },
    groupsUnRead(){
      return this.messageList.some(item=>{
        return item.groupId && item.status === 1
      })
    },
    usersUnRead(){
      return this.messageList.some(item=>{
        return item.bridge.length && item.status === 1
      })
    },
    currentUserList() {
      let vm = this;
      vm.users.map(user=>{
        user.unread = this.messageList.filter(item=>{
          return item.bridge.length && item.uid === user.uid && item.status === 1
        }).length
        return user;
      })
      return vm.users;
    }
  },
  methods: {
    addGroup(item){
      this.socket.send(JSON.stringify({
        uid: this.uid,
        type: 20,
        nickname: this.nickname,
        groupId: item.id,
        state: this.state,
        groupName: item.name,
        bridge: []
      }));
      this.$message({type: 'success', message: `Success Join ${item.name} and ${group}` })
    },
    checkUserIsGroup (item) {
      return item.users.some(item=>{
        return item.uid === this.uid
      })
    },
    createGroup(){
      this.groupName = this.groupName.trim();
      if(!this.groupName){
        this.$message({type: 'error', message: 'SG name'})
        return;
      }
      this.socket.send(JSON.stringify({
        uid: this.uid,
        type: 10,
        nickname: this.nickname,
        groupName: this.groupName,
        bridge: []
      }));
    },
    triggerGroup(item) {
      let issome = item.users.some(item=>{
        return item.uid === this.uid
      })
      if(!issome){
        this.$message({type: 'error', message: `You are  not ${item.name} member`})
        return
      }
      this.bridge = [];
      this.groupId = item.id;
      this.title = `chat ${item.name}`;
    },
    triggerPersonal(item) {
      if(this.uid === item.uid){
        return;
      }
      this.groupId = '';
      this.bridge = [this.uid, item.uid];
      this.title = `chat ${item.nickname}`;
    },
    send(){
      this.msg = this.msg.trim();
      if(!this.msg){
        return
      }
      if(!this.bridge.length && !this.groupId){
        this.$message({type: 'error', message: 'Choose'})
        return;
      }
      this.sendMessage(100, this.msg)
    },
    sendMessage(type, msg){
      console.log("sendMessage");
      this.socket.send(JSON.stringify({
        uid: this.uid,
        type: type,
        nickname: this.nickname,
        msg: msg,
        bridge: this.bridge,
        groupId: this.groupId,
        state:this.state
      }));
      this.msg = '';
    },
    conWebSocket(){
      let vm = this;
      if(window.WebSocket){
        vm.socket = new WebSocket('ws://localhost:8001');
        let socket = vm.socket;

        socket.onopen = function(e){
          console.log("Server Succ");
          vm.$message({type: 'success', message: 'Server Succ'})
          if(!vm.uid){
            vm.uid = 'web_im_' + moment().valueOf();
            localStorage.setItem('WEB_IM_USER', JSON.stringify({
              uid: vm.uid,
              nickname: vm.nickname,
              state: vm.state
            }))
          }
          vm.sendMessage(1)
        }
        socket.onclose = function(e){
          console.log("Clse");
        }
        socket.onerror = function(){
          console.log("Wrong");
        }
        // 接收服务器的消息
        socket.onmessage = function(e){
          let message = JSON.parse(e.data);
          vm.messageList.push(message);
          if(message.users) {
            vm.users = message.users;
          }
          if (message.groups){
            vm.groups = message.groups;
          }
          
          vm.$nextTick(function(){
            var div = document.getElementById('im-record');
            div.scrollTop = div.scrollHeight;
          })
        }
      }
    },
    login(){
      this.nickname = this.nickname.trim();
      if(!this.nickname){
        this.$message({type: 'error', message: 'Name?'})
        return;
      }
      this.$refs.loginDialog.hide()
      this.conWebSocket();
    },
    stateIN(){
      this.state = this.state.trim();
      if(!this.state){
        this.$message({type: 'error', message: 'Your state plz'})
        return;
      }
      this.$refs.stateDialog.hide()
      this.socket.send(JSON.stringify({
        uid: this.uid,
        type: 99,
        nickname: this.nickname,
        state:this.state,
        bridge: []
      }));
    }
  }
}
</script>

<style lang='stylus'>
  @import './app.styl';
</style>
