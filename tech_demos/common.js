var ytmnd = {};

if (!window.console || !window.console.log || !window.console.dir || !window.console.debug)
{

  if (!!window.console && !!window.console.log && !!window.console.dir) {
    window.console.debug = window.console.log;
  }
  else {
    var overloads = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
                     "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

    window.console = console = {};

    for (var i = 0; i < overloads.length; ++i) {
      window.console[overloads[i]] = function() {};
    }
  }
}

console.max = function(){
  for (var i = arguments.length - 1; i >= 0; i--) {
    arguments[i+1] = arguments[i];
  }

  arguments.length++;
  arguments[0] = new ytmnd.timestamp().toString();

  try {
    if (!console.log.apply) {
      if (console.dir) {
        console.dir(arguments);
      }

      return false;
    }

    console.log.apply(this, arguments);
  }
  catch (error) {}
}

ytmnd.timestamp = function (date)
{
  if (typeof date == 'undefined') {
    var date = new Date();
  }

  var minutes = date.getMinutes().toString();
  var hours   = date.getHours().toString();
  var seconds = date.getSeconds().toString();
  var milliseconds = date.getMilliseconds().toString();

  this.value = this.int_pad(hours) + ':' + this.int_pad(minutes) + ':' + this.int_pad(seconds) + '.' + this.int_pad(milliseconds);
}

ytmnd.timestamp.prototype.toString = function()
{
  return this.value + '   ';
};

ytmnd.timestamp.prototype.int_pad = function(source, target_length)
{
  if (typeof target_length == 'undefined') {
    var target_length = 2;
  }

  source = source.toString();

  while (source.length < target_length) {
    source = '0' + source;
  }

  return source;
};


