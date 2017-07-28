// simplest event emitter 60 lines
// ===============================
var _ = require("../util.js");
var API = {
  $on: function(event, fn, desc) {
    if(typeof event === "object" && event){
      for (var i in event) {
        this.$on(i, event[i], fn);
      }
    }else{
      // Hong: $once即是通过添加desc通过$on来实现的
      desc = desc || {};
      // @patch: for list
      var context = this;
      // Hong: handles 存储所有事件，每个类型对应一个数组calls
      var handles = context._handles || (context._handles = {}),
        calls = handles[event] || (handles[event] = []);
      var realFn;
      if(desc.once){
        realFn = function(){
          fn.apply( this, arguments )
          this.$off(event, fn);
        }
        fn.real = realFn;
      }
      calls.push(realFn || fn);
    }
    return this;
  },
  $off: function(event, fn) {
    var context = this;
    if(!context._handles) return;
    // Hong: 如果不指定事件类型，就全部取消；
    //       不指定具体的函数，就把指定类型的函数全部取消
    //       指定具体的函数，就查询比较并取消
    if(!event) this._handles = {};
    var handles = context._handles,
      calls;

    if (calls = handles[event]) {
      if (!fn) {
        handles[event] = [];
        return context;
      }
      fn = fn.real || fn;
      for (var i = 0, len = calls.length; i < len; i++) {
        if (fn === calls[i]) {
          calls.splice(i, 1);
          return context;
        }
      }
    }
    return context;
  },
  // bubble event
  $emit: function(event){
    // @patch: for list
    var context = this;
    var handles = context._handles, calls, args, type;
    if(!event) return;
    var args = _.slice(arguments, 1);
    var type = event;

    if(!handles) return context;
    // Hong: 对于所有绑定的指定类型的函数进行遍历执行
    //       分别调用剔除第一个字符的回调，以及完整名字注册的回调
    //       比如$destroy，会分别调用destroy和$destroy
    if(calls = handles[type.slice(1)]){
      for (var j = 0, len = calls.length; j < len; j++) {
        calls[j].apply(context, args)
      }
    }
    if (!(calls = handles[type])) return context;
    for (var i = 0, len = calls.length; i < len; i++) {
      calls[i].apply(context, args)
    }
    // if(calls.length) context.$update();
    return context;
  },
  // capture  event
  $once: function(event, fn){
    var args = _.slice(arguments);
    args.push({once: true})
    return this.$on.apply(this, args);
  }
}
// container class
function Event() {}
_.extend(Event.prototype, API)

Event.mixTo = function(obj){
  obj = typeof obj === "function" ? obj.prototype : obj;
  _.extend(obj, API)
}
module.exports = Event;