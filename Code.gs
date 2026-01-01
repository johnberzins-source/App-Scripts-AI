function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Casual Wikipedia AI");
}

/***********************
 * MAIN CHAT FUNCTION
 ***********************/
function chat(message) {
  if (!message) return "Say something and I’ll try to respond.";
  message = message.trim();
  if (!message) return "Say something and I’ll try to respond.";

  if (isGreeting(message)) return greetingResponse();

  var topic = extractTopic(message);
  var context = {
    message: message,
    topic: topic,
    isQuestion: isQuestion(message)
  };

  var questionWords = ["what","who","where","when","why","how"];
  var firstWord = message.split(" ")[0].toLowerCase();
  var preferredStart = questionWords.indexOf(firstWord) !== -1
    ? firstWord
    : null;

  var trainingData = getSpreadsheetTrainingData();
  if (!context.isQuestion) {
    trainingData = trainingData.concat(getCasualTrainingData());
  }

  var extraData = [];

  if (topic) {
    var wikiText = getKnowledge(topic);
    if (wikiText) {
      var sentences = wikiText.split(/[.!?]+/);
      for (var i = 0; i < sentences.length; i++) {
        var s = sentences[i].trim();
        if (s) {
          trainingData.push(s);
          extraData.push(s);
        }
      }
    }
  }

  var domainManager = new DomainManager([
    FoodDomain,
    TechDomain,
    PersonDomain,
    PlaceDomain
  ]);

  var domain = domainManager.detect(context);

  if (domain && domain.fetchSources) {
    var domainData = domain.fetchSources(topic) || [];
    for (var d = 0; d < domainData.length; d++) {
      if (domainData[d]) {
        trainingData.push(domainData[d]);
        extraData.push(domainData[d]);
      }
    }
  }

  // ✅ FILL TEMPLATES ONCE
  if (domain && domain.templates) {
    var templates = domain.templates();
    for (var t = 0; t < templates.length; t++) {
      trainingData.push(
        fillTemplate(templates[t], context, extraData)
      );
    }
  }

  if (!trainingData.length) {
    return "I don’t have enough information to work with yet.";
  }

  var gen = new MarkovGenerator({ maxOrder: 3 });
  gen.train(trainingData);

  var sentenceCount = Math.min(
    10,
    Math.max(4, Math.floor(trainingData.join(" ").length / 500))
  );

  var response = gen.generateParagraph(sentenceCount, preferredStart);
  return humanize(response);
}

/***********************
 * TEMPLATE FILLING
 ***********************/
function fillTemplate(template, context, extraData) {
  var values = extractPlaceholderValues(context.topic, extraData);

  return template
    .replace(/__topic__/g, context.topic || "this topic")
    .replace(/__ingredients__/g, values.__ingredients__)
    .replace(/__flavor__/g, values.__flavor__)
    .replace(/__occasion__/g, values.__occasion__)
    .replace(/__region__/g, values.__region__)
    .replace(/__achievement__/g, values.__achievement__)
    .replace(/__notable_fact__/g, values.__notable_fact__)
    .replace(/__purpose__/g, values.__purpose__)
    .replace(/__function__/g, values.__function__)
    .replace(/__reason__/g, values.__reason__);
}

function extractPlaceholderValues(topic, extraData) {
  var text = extraData.join(" ").toLowerCase();
  var values = {};

  var ingredientMatch = text.match(/(?:ingredients|uses|made with)\s+([a-z ,]+)/i);
  values.__ingredients__ = ingredientMatch
    ? ingredientMatch[1]
    : (topic || "common ingredients");

  var flavorMatch = text.match(/sweet|sour|creamy|spicy|chocolate|vanilla/i);
  values.__flavor__ = flavorMatch ? flavorMatch[0] : "delicious";

  values.__occasion__ =
    /birthday|party|holiday/i.test(text)
      ? "special occasions"
      : "everyday use";

  values.__region__ = "various regions";
  values.__achievement__ = "notable achievements";
  values.__notable_fact__ = "something interesting";
  values.__purpose__ = "general purposes";
  values.__function__ = "perform useful tasks";
  values.__reason__ = "its importance";

  return values;
}



/***********************
 * GREETINGS
 ***********************/
function isGreeting(text) {
  if (!text) return false;
  return /^(hi|hello|hey|yo|what's up|whats up|sup)$/i.test(text.trim());
}

function greetingResponse() {
  var replies = [
    "Hey! What’s up?",
    "Hi there. What do you want to talk about?",
    "Hello! Ask me anything.",
    "Hey, I’m here.",
    "What’s going on?"
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}


function extractTopic(message) {
  if (!message) return null;


  message = message
  .replace(/^can you\s+/i, "")
  .replace(/^could you\s+/i, "")
  .replace(/^would you\s+/i, "");
  
  var lower = message.toLowerCase();

  var prefixes = [
    "what is",
    "who is",
    "where is",
    "when is",
    "why is",
    "how does",
    "how do",
    "tell me about",
    "explain",
    "can you explain",
    "could you explain",
    "would you explain",
    "can you tell me about",
    "could you tell me about"
  ];

  for (var i = 0; i < prefixes.length; i++) {
    if (lower.startsWith(prefixes[i])) {
      return message.substring(prefixes[i].length).trim();
    }
  }

  // Short inputs = topic
  if (message.split(" ").length <= 4) {
    return message;
  }

  // Capitalized phrase fallback
  var caps = message.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
  if (caps) return caps[1];

  return null;
}



function isQuestion(text) {
  if (!text) return false;

  text = text.trim().toLowerCase();

  // Ends with a question mark
  if (text.endsWith("?")) return true;

  // Starts with common question words
  var questionStarters = [
    "what",
    "who",
    "where",
    "when",
    "why",
    "how",
    "is",
    "are",
    "does",
    "do",
    "can",
    "could",
    "should",
    "would"
  ];

  var firstWord = text.split(" ")[0];
  return questionStarters.indexOf(firstWord) !== -1;
}

function getSpreadsheetTrainingData() {
  // No spreadsheet dependency
  return [];
}




function humanize(text) {
  if (!text) return "";

  // Fix spacing
  text = text
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize standalone "i"
  text = text.replace(/\bi\b/g, "I");

  // Remove repeated words (simple de-dup)
  text = text.replace(/\b(\w+)\s+\1\b/gi, "$1");

  // Ensure proper sentence spacing
  text = text.replace(/\.\s*/g, ". ");

  // Trim overly long output
  var MAX_LENGTH = 1200;
  if (text.length > MAX_LENGTH) {
    text = text.substring(0, MAX_LENGTH);
    text = text.replace(/[^.!?]+$/, "") + ".";
  }

  return text;
}


function getCasualTrainingData() {
  return [
    "That is an interesting topic to talk about.",
    "Many people find this subject fascinating.",
    "It is often discussed in different contexts.",
    "There are several aspects worth exploring.",
    "This topic can be understood in many ways.",
    "People often ask questions about this.",
    "It has become more popular over time.",
    "There is a lot to learn about this subject."
  ];
}

function getKnowledge(topic) {
  if (!topic) return null;

  var sources = [];

  // Primary sources
  var wiki = getWikipediaFull(topic);
  if (wiki) sources.push(wiki);

  var simple = getSimpleWikipedia(topic);
  if (simple) sources.push(simple);

  var wikidata = getWikidataSummary(topic);
  if (wikidata) sources.push(wikidata);

  // LAST RESORT: dictionary
  if (!sources.length) {
    var dictionary = getDictionaryDefinition(topic);
    if (dictionary) sources.push(dictionary);
  }

  return sources.length ? sources.join(" ") : null;
}
