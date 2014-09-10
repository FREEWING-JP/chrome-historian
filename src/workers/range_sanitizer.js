// Generated by CoffeeScript 1.7.1
(function() {
  var RangeSanitizer;

  RangeSanitizer = (function() {
    function RangeSanitizer() {}

    RangeSanitizer.prototype.run = function(results, options) {
      var out, result, _i, _len;
      this.options = options;
      out = [];
      for (_i = 0, _len = results.length; _i < _len; _i++) {
        result = results[_i];
        if (this.verifyDateRange(result)) {
          out.push(result);
        }
      }
      out.sort(this.sortByTime);
      return out;
    };

    RangeSanitizer.prototype.verifyDateRange = function(result) {
      return result.lastVisitTime > this.options.startTime && result.lastVisitTime < this.options.endTime;
    };

    RangeSanitizer.prototype.sortByTime = function(a, b) {
      if (a.lastVisitTime > b.lastVisitTime) {
        return -1;
      }
      if (a.lastVisitTime < b.lastVisitTime) {
        return 1;
      }
      return 0;
    };

    return RangeSanitizer;

  })();

  if (typeof onServer !== "undefined" && onServer !== null) {
    module.exports = RangeSanitizer;
  } else {
    self.addEventListener('message', function(e) {
      var sanitizer;
      sanitizer = new RangeSanitizer();
      return postMessage(sanitizer.run(e.data.results, e.data.options));
    });
  }

}).call(this);
