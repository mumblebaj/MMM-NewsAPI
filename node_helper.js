// Imports
var NodeHelper = require('node_helper')
// var request = require('request')
var fetch = require('node-fetch')
// var moment = require('moment')
var luxon = require('luxon')
const querystring = require('querystring')
const DateTime = luxon.DateTime

// Any declarations

module.exports = NodeHelper.create({
    // Start function
    start: function() {
        console.log('Starting node_helper for module: ' + this.name)

        // Declare any defaults
        this.config = null
        this.articles = []
        this.endPoint1 = "https://newsapi.org/v2/top-headlines?"
        this.endPoint2 = "https://newsapi.org/v2/everything?"
    },

    deconHeadlines: function(payload) {
        var query = payload
        for(i in query) {
            var q = query[i]
            var qs = {}
            if (q.hasOwnProperty("sources") && q.sources !== "") {
                var t = q["sources"].replace(/\s/g, "")
                qs = Object.assign({}, qs, {"sources":t})
            }
            if (q.hasOwnProperty("q") && q.q !== "") qs = Object.assign({}, qs, {"q":q["q"]})
            if (q.hasOwnProperty("qInTitle") && q.qInTitle !== "") qs = Object.assign({}, qs, {"qIntTitle":q["qInTitle"]})
            if (q.hasOwnProperty("category") && q.category !== "") qs = Object.assign({}, qs, {"category":q["category"]})
            if (q.hasOwnProperty("domains") && q.domains !== "") {
                var d = q["domains"].replace(/\s/g, "")
                qs = Object.assign({}, qs, {"domains":d})
            }
            if (q.hasOwnProperty("excludeDomains") && q.excludeDomains !== "") {
                var ed = q["domains"].replace(/\s/g, "")
                qs = Object.assign({}, qs, {"excludeDomains":ed})
            }
            if (q.hasOwnProperty("language") && q.language !== "") qs = Object.assign({}, qs, {"language":q["language"]})
            if (q.hasOwnProperty("country") && q.country !== "") {
                if (q.sources === "") {
                    qs = Object.assign({}, qs, {"country":q["country"]})
                } else if (!q.sources) {
                    qs = Object.assign({}, qs, {"country":q["country"]})
                }
            } 
            qs = Object.assign({}, qs, {"pageSize":payload.pageSize})
            qs = Object.assign({}, qs, {"apiKey":payload.apiKey})
            var qp = querystring.stringify(qs)
            var callScript = this.endPoint1 + qp
        }
        this.getData(callScript, payload)
    },

    deconEverything: function(payload){
        var query = payload
        for(i in query) {
            var q = query[i]
            var qs = {}
            if (q.hasOwnProperty("country") && q.country !== "") {
                console.log("[MMM-NEWSAPI] Invalid Option specified. Country not allowed with 'everything'!")
            }
            if (q.hasOwnProperty("category") && q.category !== "") {
                console.log("[MMM-NEWSAPI] Invalid Option specified. Country not allowed with 'everything'!")
            }
            if (q.hasOwnProperty("q") && q.q !== "") qs =Object.assign({}, qs, {"q":q["q"]})
            if (q.hasOwnProperty("qInTitle") && q.qInTitle !== "") qs = Object.assign({}, qs, {"qIntTitle":q["qInTitle"]})
            if (q.hasOwnProperty("domains") && q.domains !== "") {
            var d = q["domains"].replace(/\s/g, "")
            qs = Object.assign({}, qs, {"domains":d})
            }
            if (q.hasOwnProperty("excludeDomains") && q.excludeDomains !== "") {
                var ed = q["excludeDoomains"].replace(/\s/g, "")
                qs = Object.assign({}, qs, {"excludeDomains":ed})
            }
            if (q.hasOwnProperty("sources") && q.sources !== "") {
            var t = q["sources"].replace(/\s/g, "")
            qs = Object.assign({}, qs, {"sources":t})
            }
            if (q.hasOwnProperty("language") && q.language !== "") qs = Object.assign({}, qs, {"language":q["language"]})
            qs = Object.assign({}, qs, {"pageSize":payload.pageSize})
            qs = Object.assign({}, qs, {"apiKey":payload.apiKey})
            var qp = querystring.stringify(qs)
            var callScript = this.endPoint2 + qp
        }
        this.getData(callScript, payload)
    },

    formatResults: function(ret, payload) {
        var results = []
        var self = this
        var count = payload.pageSize
        for (j in ret.articles) {
            var article = ret.articles[j]
            article.sourceName = article.source.name
            // var time = moment(article.publishedAt)
            // article.publishedAt = time.fromNow()
            luxTime = DateTime.fromISO(article.publishedAt).toRelative()
            article.publishedAt = luxTime
            if(!article.content) article.content = article.description
            if(!article.author) article.author = ""
            if(!article.description) article.description = article.content
            results.push(article)
        }
        if (results.length > 0) this.articles = this.articles.concat(results)
        this.sendSocketNotification("UPDATE", this.articles)
    },

    async getData(callScript, payload) {
        var response = await fetch(callScript)

        if(!response.status == 200) {
            console.error(`Error retrieving NewsAPI data: ${response.statusCode} ${response.statusText}`)
            return;
        }
        var parsedResponse = await response.json()
        this.formatResults(parsedResponse, payload)
    },

    // Socket Notification Received
    socketNotificationReceived: function(notification, payload) {
        if (notification === "headlines") {
            this.deconHeadlines(payload)
        } else if (notification === "everything") {
            this.deconEverything(payload)
        }
    },
})