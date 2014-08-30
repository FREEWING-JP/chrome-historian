class SearchSanitizer
  run: (results, @options) ->
    @terms = @options.text.split(' ')

    prunedResults = []
    for result in results
      if prunedResults.length >= 1000
        break
      else
        result.location = result.url
        result.name = result.title

        if @verifyTextMatch(result)
          @removeScriptTags(result)
          prunedResults.push(result)

    prunedResults.sort(@sortByTime)
    prunedResults

  verifyTextMatch: (result) ->
    hits = []
    regExp = null

    for term in @terms
      regExp = new RegExp(term, "i")
      if result.url.match(regExp) || result.title.match(regExp)
        hits.push(true)

    if @terms? && hits.length == @terms.length then true else false

  removeScriptTags: (result) ->
    regex = /<(.|\n)*?>/ig
    for property in ['title', 'url', 'location']
      result[property] = result[property].replace(regex, "")

  sortByTime: (a, b) ->
    return -1 if a.lastVisitTime > b.lastVisitTime
    return 1 if a.lastVisitTime < b.lastVisitTime
    0

if onServer?
  module.exports = SearchSanitizer
else
  self.addEventListener 'message', (e) ->
    sanitizer = new SearchSanitizer()
    postMessage(sanitizer.run(e.data.results, e.data.options))
