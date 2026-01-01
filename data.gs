function getSimpleWikipedia(topic) {
  try {
    var url =
      "https://simple.wikipedia.org/w/api.php" +
      "?action=parse&prop=text&format=json&page=" +
      encodeURIComponent(topic);

    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;

    var data = JSON.parse(r.getContentText());
    if (!data.parse) return null;

    return stripHtml(data.parse.text["*"]).substring(0, 8000);
  } catch (e) {
    return null;
  }
}

function getWikidataSummary(topic) {
  try {
    var url =
      "https://www.wikidata.org/w/api.php" +
      "?action=wbsearchentities&search=" +
      encodeURIComponent(topic) +
      "&language=en&format=json";

    var r = UrlFetchApp.fetch(url);
    var data = JSON.parse(r.getContentText());

    if (!data.search || !data.search.length) return null;

    return data.search
      .map(e => e.label + " is " + e.description + ".")
      .join(" ");
  } catch (e) {
    return null;
  }
}

function getDictionaryDefinition(word) {
  try {
    var url =
      "https://api.dictionaryapi.dev/api/v2/entries/en/" +
      encodeURIComponent(word);

    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;

    var data = JSON.parse(r.getContentText());
    if (!data || !data[0] || !data[0].meanings) return null;

    var defs = [];

    for (var i = 0; i < data[0].meanings.length; i++) {
      var meaning = data[0].meanings[i];
      for (var j = 0; j < meaning.definitions.length; j++) {
        defs.push(
          word + " means " + meaning.definitions[j].definition + "."
        );
      }
    }

    return defs.slice(0, 5).join(" ");
  } catch (e) {
    return null;
  }
}


function getWikipediaFull(topic) {
  if (!topic) return null;

  try {
    var url =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(topic);

    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true
    });

    if (response.getResponseCode() !== 200) return null;

    var data = JSON.parse(response.getContentText());

    // Ignore disambiguation pages
    if (data.type === "disambiguation") return null;

    var text = [];

    if (data.extract) text.push(data.extract);

    // Add description if available
    if (data.description) {
      text.push(topic + " is " + data.description + ".");
    }

    return text.join(" ");
  } catch (e) {
    return null;
  }
}
