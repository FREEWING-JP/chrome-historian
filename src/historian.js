(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ChromeHistoryAPI;

ChromeHistoryAPI = (function() {
  function ChromeHistoryAPI(chromeAPI) {
    this.chromeAPI = chromeAPI != null ? chromeAPI : chrome;
  }

  ChromeHistoryAPI.prototype.sessions = function(callback) {
    if (callback == null) {
      callback = function() {};
    }
    return this.chromeAPI.sessions.getDevices(function(devices) {
      return callback(devices);
    });
  };

  ChromeHistoryAPI.prototype.query = function(options, callback) {
    if (callback == null) {
      callback = function() {};
    }
    return this.chromeAPI.history.search(options, (function(_this) {
      return function(visits) {
        return callback(visits);
      };
    })(this));
  };

  ChromeHistoryAPI.prototype.deleteAll = function(callback) {
    if (callback == null) {
      callback = function() {};
    }
    return this.chromeAPI.history.deleteAll(function() {
      return callback();
    });
  };

  ChromeHistoryAPI.prototype.deleteUrl = function(url, callback) {
    if (callback == null) {
      callback = function() {};
    }
    if (url == null) {
      throw "Url needed";
    }
    return this.chromeAPI.history.deleteUrl({
      url: url
    }, function() {
      return callback();
    });
  };

  ChromeHistoryAPI.prototype.deleteRange = function(range, callback) {
    if (callback == null) {
      callback = function() {};
    }
    if (range.startTime == null) {
      throw "Start time needed";
    }
    if (range.endTime == null) {
      throw "End time needed";
    }
    return this.chromeAPI.history.deleteRange(range, (function(_this) {
      return function() {
        return callback();
      };
    })(this));
  };

  return ChromeHistoryAPI;

})();

module.exports = ChromeHistoryAPI;



},{}],2:[function(require,module,exports){
var ChromeHistoryAPI, Day, Processor;

ChromeHistoryAPI = require('./chrome_history_api.coffee');

Processor = require('./processor.coffee');

Day = (function() {
  function Day(date) {
    date.setHours(0, 0, 0, 0);
    this.startTime = date.getTime();
    date.setHours(23, 59, 59, 999);
    this.endTime = date.getTime();
    this.history = new ChromeHistoryAPI();
  }

  Day.prototype.fetch = function(callback) {
    var options;
    if (callback == null) {
      callback = function() {};
    }
    options = {
      startTime: this.startTime,
      endTime: this.endTime,
      text: '',
      maxResults: 5000
    };
    return this.history.query(options, (function(_this) {
      return function(results) {
        options = {
          options: options,
          results: results
        };
        return new Processor('range_sanitizer.js', options, function(visits) {
          return new Processor('groomer.js', {
            results: visits
          }, function(visits) {
            return callback(visits);
          });
        });
      };
    })(this));
  };

  Day.prototype.destroy = function(callback) {
    var options;
    if (callback == null) {
      callback = function() {};
    }
    options = {
      startTime: this.startTime,
      endTime: this.endTime
    };
    return this.history.deleteRange(options, (function(_this) {
      return function() {
        return callback();
      };
    })(this));
  };

  Day.prototype.destroyHour = function(hour, callback) {
    var endTime, options, startTime;
    if (callback == null) {
      callback = function() {};
    }
    startTime = new Date(this.startTime);
    startTime.setHours(hour);
    endTime = new Date(this.endTime);
    endTime.setHours(hour);
    options = {
      startTime: startTime.getTime(),
      endTime: endTime.getTime()
    };
    return this.history.deleteRange(options, (function(_this) {
      return function() {
        return callback();
      };
    })(this));
  };

  return Day;

})();

module.exports = Day;



},{"./chrome_history_api.coffee":1,"./processor.coffee":5}],3:[function(require,module,exports){
var ChromeHistoryAPI, Devices, Processor;

ChromeHistoryAPI = require('./chrome_history_api.coffee');

Processor = require('./processor.coffee');

Devices = (function() {
  function Devices() {
    this.history = new ChromeHistoryAPI();
  }

  Devices.prototype.fetch = function(callback) {
    return this.history.sessions(function(devices) {
      var device, names;
      names = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = devices.length; _i < _len; _i++) {
          device = devices[_i];
          _results.push({
            name: device.deviceName,
            lastChanged: device.sessions[0].lastModified
          });
        }
        return _results;
      })();
      return callback(names);
    });
  };

  Devices.prototype.fetchSessions = function(name, callback) {
    var out, processSession;
    out = [];
    processSession = function(session, i, numberOfSessions) {
      var visits;
      visits = session.window.tabs;
      return new Processor('groomer.js', {
        results: visits
      }, function(results) {
        out.push({
          id: session.window.sessionId,
          sites: results
        });
        if (i === numberOfSessions) {
          return callback(out);
        }
      });
    };
    return this.history.sessions(function(devices) {
      var device, i, session, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = devices.length; _i < _len; _i++) {
        device = devices[_i];
        if (device.deviceName === name) {
          _results.push((function() {
            var _j, _len1, _ref, _results1;
            _ref = device.sessions;
            _results1 = [];
            for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
              session = _ref[i];
              _results1.push(processSession(session, i + 1, device.sessions.length));
            }
            return _results1;
          })());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
  };

  return Devices;

})();

module.exports = Devices;



},{"./chrome_history_api.coffee":1,"./processor.coffee":5}],4:[function(require,module,exports){
var ChromeHistoryAPI, historyAPI,
  __slice = [].slice;

ChromeHistoryAPI = require('./chrome_history_api.coffee');

historyAPI = new ChromeHistoryAPI();

window.Historian = {
  Devices: require('./devices.coffee'),
  Day: require('./day.coffee'),
  Search: require('./search.coffee'),
  deleteUrl: function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return historyAPI.deleteUrl.apply(historyAPI, args);
  },
  deleteRange: function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return historyAPI.deleteRange.apply(historyAPI, args);
  },
  deleteAll: function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return historyAPI.deleteAll.apply(historyAPI, args);
  }
};



},{"./chrome_history_api.coffee":1,"./day.coffee":2,"./devices.coffee":3,"./search.coffee":6}],5:[function(require,module,exports){
var Processor;

Processor = (function() {
  function Processor(file, options, callback) {
    var path, worker;
    if (options == null) {
      options = {};
    }
    path = options.path || "scripts/workers/";
    worker = new Worker(path + file);
    worker.postMessage(options);
    worker.onmessage = function(e) {
      if (e.data.log) {
        return console.log(e.data.log);
      } else {
        callback(e.data);
        return worker.terminate();
      }
    };
  }

  return Processor;

})();

module.exports = Processor;



},{}],6:[function(require,module,exports){
var ChromeHistoryAPI, Processor, Search;

ChromeHistoryAPI = require('./chrome_history_api.coffee');

Processor = require('./processor.coffee');

Search = (function() {
  function Search(query) {
    this.query = query;
    this.history = new ChromeHistoryAPI();
  }

  Search.prototype.fetch = function(options, callback) {
    var defaultOptions, endTime, startAtResult, startTime;
    if (callback == null) {
      callback = function() {};
    }
    defaultOptions = {
      text: '',
      startTime: 0,
      maxResults: 5000
    };
    options = _.extend(defaultOptions, options);
    startTime = options.startTime, endTime = options.endTime;
    startAtResult = options.startAtResult;
    delete options.startAtResult;
    return chrome.storage.local.get('lastSearchCache', (function(_this) {
      return function(data) {
        var cache;
        cache = data.lastSearchCache;
        if ((cache != null ? cache.query : void 0) === _this.query && (cache != null ? cache.startTime : void 0) === startTime && (cache != null ? cache.endTime : void 0) === endTime && !startAtResult) {
          return callback(cache.results, new Date(cache.datetime));
        } else {
          return _this.history.query(options, function(history) {
            options = {
              options: {
                text: _this.query
              },
              results: history
            };
            return new Processor('search_sanitizer.js', options, function(results) {
              var setCache;
              setCache = function(results) {
                return chrome.storage.local.set({
                  lastSearchCache: {
                    results: results,
                    datetime: new Date().getTime(),
                    query: _this.query,
                    startTime: startTime,
                    endTime: endTime
                  }
                });
              };
              if (startTime && endTime) {
                return new Processor('range_sanitizer.js', {
                  options: {
                    startTime: startTime,
                    endTime: endTime
                  },
                  results: results
                }, function(sanitizedResults) {
                  return new Processor('groomer.js', {
                    results: sanitizedResults
                  }, function(results) {
                    setCache(results);
                    return callback(results);
                  });
                });
              } else {
                return new Processor('groomer.js', {
                  results: results
                }, function(results) {
                  setCache(results);
                  return callback(results);
                });
              }
            });
          });
        }
      };
    })(this));
  };

  Search.prototype.expireCache = function() {
    return chrome.storage.local.remove('lastSearchCache');
  };

  Search.prototype.deleteUrl = function(url, callback) {
    this.history.deleteUrl(url, function() {
      return callback();
    });
    return chrome.storage.local.get('lastSearchCache', (function(_this) {
      return function(data) {
        var results;
        results = data.lastSearchCache.results;
        data.lastSearchCache.results = _.reject(results, function(visit) {
          return visit.url === url;
        });
        return chrome.storage.local.set(data);
      };
    })(this));
  };

  Search.prototype.destroy = function(options, callback) {
    if (options == null) {
      options = {};
    }
    if (callback == null) {
      callback = function() {};
    }
    return this.fetch(options, (function(_this) {
      return function(history) {
        var i, visit, _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = history.length; _i < _len; i = ++_i) {
          visit = history[i];
          _results.push(_this.history.deleteUrl(visit.url, function() {
            if (i === history.length) {
              _this.expireCache();
              return callback();
            }
          }));
        }
        return _results;
      };
    })(this));
  };

  return Search;

})();

module.exports = Search;



},{"./chrome_history_api.coffee":1,"./processor.coffee":5}]},{},[4]);
