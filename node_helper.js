// Imports
const Log = require("logger")
const NodeHelper = require("node_helper")
const luxon = require("luxon")
const querystring = require("querystring") // querystring has been deprecated and need to be replaced by URLSearchParams possibly
const DateTime = luxon.DateTime

// Any declarations

module.exports = NodeHelper.create({
    requiresVersion: "2.21.0",

    start () {
        Log.log(`Starting node_helper for module: ${this.name}`)

        // Declare any defaults
        this.config = null
        this.articles = []
        this.endPoint1 = "https://newsapi.org/v2/top-headlines?"
        this.endPoint2 = "https://newsapi.org/v2/everything?"
    },

    deconHeadlines (payload) {
        const query = payload
        for (const i in query) {
            const q = query[i]
            let qs = {}
            if (Object.hasOwn(q, "sources") && q.sources !== "") {
                const t = q.sources.replace(/\s/gu, "")
                qs = {...qs, sources: t}
            }
            if (Object.hasOwn(q, "q") && q.q !== "") { qs = {...qs, q: q.q} }
            if (Object.hasOwn(q, "qInTitle") && q.qInTitle !== "") { qs = {...qs, qInTitle: q.qInTitle} }
            if (Object.hasOwn(q, "category") && q.category !== "") { qs = {...qs, category: q.category} }
            if (Object.hasOwn(q, "domains") && q.domains !== "") {
                const d = q.domains.replace(/\s/gu, "")
                qs = {...qs, domains: d}
            }
            if (Object.hasOwn(q, "excludeDomains") && q.excludeDomains !== "") {
                const ed = q.domains.replace(/\s/g, "")
                qs = {...qs, excludeDomains: ed}
            }
            if (Object.hasOwn(q, "language") && q.language !== "") { qs = {...qs, language: q.language} }
            if (Object.hasOwn(q, "country") && q.country !== "") {
                if (q.sources === "") {
                    qs = {...qs, country: q.country}
                } else if (!q.sources) {
                    qs = {...qs, country: q.country}
                }
            }
            qs = {...qs, pageSize: payload.pageSize}
            if (Object.hasOwn(q, "sortBy") && q.sortBy !== "") { qs = {...qs, sortBy: payload.sortBy} }
            qs = {...qs, apiKey: payload.apiKey}
            const qp = querystring.stringify(qs)
            var callScript = this.endPoint1 + qp
        }
        if (payload.debug) { Log.log("headlines callscript: ", callScript) }
        this.getData(callScript, payload)
    },

    deconEverything (payload) {
        const query = payload
        for (const i in query) {
            const q = query[i]
            let qs = {}
            if (Object.hasOwn(q, "country") && q.country !== "") {
                Log.log("[MMM-NEWSAPI] Invalid Option specified. Country not allowed with 'everything'!")
            }
            if (Object.hasOwn(q, "category") && q.category !== "") {
                Log.log("[MMM-NEWSAPI] Invalid Option specified. Country not allowed with 'everything'!")
            }
            if (Object.hasOwn(q, "q") && q.q !== "") { qs = {...qs, q: q.q} }
            if (Object.hasOwn(q, "qInTitle") && q.qInTitle !== "") { qs = {...qs, qInTitle: q.qInTitle} }
            if (Object.hasOwn(q, "domains") && q.domains !== "") {
                const d = q.domains.replace(/\s/gu, "")
                qs = {...qs, domains: d}
            }
            if (Object.hasOwn(q, "excludeDomains") && q.excludeDomains !== "") {
                const ed = q.excludeDomains.replace(/\s/gu, "")
                qs = {...qs, excludeDomains: ed}
            }
            if (Object.hasOwn(q, "sources") && q.sources !== "") {
                const t = q.sources.replace(/\s/gu, "")
                qs = {...qs, sources: t}
            }
            if (Object.hasOwn(q, "language") && q.language !== "") { qs = {...qs, language: q.language} }
            qs = {...qs, pageSize: payload.pageSize}
            if (Object.hasOwn(q, "sortBy") && q.sortBy !== "") { qs = {...qs, sortBy: payload.sortBy} }
            qs = {...qs, apiKey: payload.apiKey}
            const qp = querystring.stringify(qs)
            var callScript = this.endPoint2 + qp
        }
        if (payload.debug) { Log.log("everything callscript: ", callScript) }
        this.getData(callScript, payload)
    },

    formatResults (ret, payload) {
        const results = []
        for (const j in ret.articles) {
            const article = ret.articles[j]
            article.sourceName = article.source.name
            article.sourceId = article.source.Id
            const luxTime = DateTime.fromISO(article.publishedAt).toRelative()
            article.publishedAt = luxTime
            article.content = article.content ? article.content : ""
            article.author = article.author ? article.author : ""
            article.description = article.description ? article.description : ""
            results.push(article)
        }
        if (results.length > 0) { this.articles = this.articles.concat(results) }
        if (payload.debug) { Log.log("sending articles: ", JSON.stringify(this.articles)) }
        this.sendSocketNotification("NEWSAPI_UPDATE", this.articles)
    },

    async getData (callScript, payload) {
        const response = await fetch(callScript)

        if (!response.status === 200) {
            Log.error(`Error retrieving NewsAPI data: ${response.statusCode} ${response.statusText}`)
            return;
        }
        const parsedResponse = await response.json()
        if (payload.debug) { Log.log("response received: ", JSON.stringify(parsedResponse)) }
        this.formatResults(parsedResponse, payload)
    },

    // Socket Notification Received
    socketNotificationReceived (notification, payload) {
        if (notification === "headlines") {
            this.deconHeadlines(payload)
        } else if (notification === "everything") {
            this.deconEverything(payload)
        }
    }
})

