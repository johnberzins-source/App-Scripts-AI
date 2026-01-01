var MarkovGenerator = function(opts) {
  opts = opts || {};
  this.maxOrder = opts.maxOrder || 3;
  this.models = {};
  this.START = "__START__";
  this.END = "__END__";
  this.sentenceStarts = {};

  for (var i = 1; i <= this.maxOrder; i++) {
    this.models[i] = {};
  }
};

MarkovGenerator.prototype.train = function(texts) {
  for (var t = 0; t < texts.length; t++) {
    var text = texts[t].replace(/\n/g, " ");
    var parts = text.split(/[.!?]+/);
    for (var i = 0; i < parts.length; i++) {
      this._trainSentence(parts[i].trim());
    }
  }
};

MarkovGenerator.prototype._trainSentence = function(sentence) {
  var words = sentence
    .replace(/[^a-zA-Z0-9\s,'-]/g, "")
    .toLowerCase()
    .split(/\s+/);

  if (words.length < 5) return;

  var first = words[0];
  this.sentenceStarts[first] = (this.sentenceStarts[first] || 0) + 1;

  var padded = [];
  for (var i = 0; i < this.maxOrder; i++) padded.push(this.START);
  padded = padded.concat(words);
  padded.push(this.END);

  for (var order = 1; order <= this.maxOrder; order++) {
    for (var j = 0; j < padded.length - order; j++) {
      var key = padded.slice(j, j + order).join("|");
      var next = padded[j + order];
      if (!this.models[order][key]) this.models[order][key] = {};
      this.models[order][key][next] =
        (this.models[order][key][next] || 0) + 1;
    }
  }
};

MarkovGenerator.prototype.generateParagraph = function(count, preferredStart) {
  var out = [];
  while (out.length < count) {
    var s = this._generateSentence(preferredStart);
    if (s) out.push(s);
  }
  return out.join(" ");
};

MarkovGenerator.prototype._generateSentence = function(preferredStart) {
  var start = preferredStart && this.sentenceStarts[preferredStart]
    ? preferredStart
    : this._weightedRandom(this.sentenceStarts);

  if (!start) return null;

  var state = [];
  for (var i = 0; i < this.maxOrder - 1; i++) state.push(this.START);
  state.push(start);

  var words = [start];

  for (var i = 0; i < 20; i++) {
    var next = this._nextWord(state);
    if (!next || next === this.END) break;
    words.push(next);
    state.shift();
    state.push(next);
  }

  if (words.length < 6) return null;
  return words.join(" ").charAt(0).toUpperCase() +
    words.join(" ").slice(1) + ".";
};

MarkovGenerator.prototype._nextWord = function(state) {
  for (var order = this.maxOrder; order >= 1; order--) {
    var key = state.slice(-order).join("|");
    var map = this.models[order][key];
    if (map) return this._weightedRandom(map);
  }
  return null;
};

MarkovGenerator.prototype._weightedRandom = function(map) {
  var total = 0;
  for (var k in map) total += map[k];
  var r = Math.random() * total;
  for (var k in map) {
    r -= map[k];
    if (r <= 0) return k;
  }
  return null;
};
