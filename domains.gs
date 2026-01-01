var DomainManager = function(domains) {
  this.domains = domains || [];
};

DomainManager.prototype.detect = function(context) {
  for (var i = 0; i < this.domains.length; i++) {
    if (this.domains[i].detect(context)) return this.domains[i];
  }
  return null;
};

var FoodDomain = {
  detect: function(c) {
    return /food|recipe|cake|drink|meal/i.test(c.message);
  },
  fetchSources: function(t) {
    var wiki = getWikipediaFull(t);
    return wiki ? [wiki] : [];
  },
  templates: function() {
    return [
      "This recipe typically uses __ingredients__ and is served on __occasion__.",
      "The flavor is often described as __flavor__."
    ];
  }
};

var TechDomain = {
  detect: function(c) {
    return /tech|ai|software|javascript|python/i.test(c.message);
  },
  fetchSources: function(t) {
    var wiki = getWikipediaFull(t);
    return wiki ? [wiki] : [];
  },
  templates: function() {
    return [
      "In technology, __topic__ is used for __purpose__.",
      "Developers use __topic__ to __function__."
    ];
  }
};

var PersonDomain = {
  detect: function(c) {
    return /who is|scientist|author|celebrity/i.test(c.message);
  },
  fetchSources: function(t) {
    var wiki = getWikipediaFull(t);
    return wiki ? [wiki] : [];
  },
  templates: function() {
    return [
      "__topic__ is known for __achievement__.",
      "__topic__ is remembered for __notable_fact__."
    ];
  }
};

var PlaceDomain = {
  detect: function(c) {
    return /where is|city|country|mountain|river/i.test(c.message);
  },
  fetchSources: function(t) {
    var wiki = getWikipediaFull(t);
    return wiki ? [wiki] : [];
  },
  templates: function() {
    return [
      "__topic__ is located in __region__.",
      "People often visit __topic__ for __reason__."
    ];
  }
};
