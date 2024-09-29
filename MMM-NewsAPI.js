/* global Log Module QRious */
Module.register("MMM-NewsAPI", {
    // Declare default inputs
    defaults: {
        apiKey: "",
        type: "horizontal",
        choice: "headlines",
        pageSize: 20,
        sortBy: "publishedAt",
        timeFormat: "relative",
        // className: "NEWSAPI",
        templateFile: "template.html",
        drawInterval: 1000 * 30,
        fetchInterval: 1000 * 60 * 60,
        debug: false,
        QRCode: false,
        query: {
            country: "us",
            category: "",
            q: "",
            qInTitle: "",
            sources: "",
            domains: "",
            excludeDomains: "",
            language: "en"
        }
    },

    // Get the Stylesheet
    getStyles () {
        return [this.file("MMM-NewsAPI.css")]
    },

    // Import QR code script file
    getScripts () {
        return [this.file("node_modules/qrious/dist/qrious.min.js")]
    },

    // Start process
    start () {
        this.firstUpdate = 0
        this.index = 0
        this.timer = null
        this.template = ""
        this.newsArticles = []
        if (this.config.debug) { Log.log("config: ", JSON.stringify(this.config)) }
        // Start function call to node_helper
        this.getInfo()
        // Schedule the next update
        this.scheduleUpdate()
    },

    stop () {
        Log.info(`Stopping module ${this.name}`)
    },

    getDom () {
        const wrapper = document.createElement("div")
        wrapper.id = "NEWSAPI"
        wrapper.className = this.config.type
        const newsContent = document.createElement("div")
        newsContent.id = "NEWS_CONTENT"
        wrapper.appendChild(newsContent)
        wrapper.classList.add("untouchable")
        return wrapper
    },

    notificationReceived (notification) {
        switch (notification) {
            case "DOM_OBJECTS_CREATED":
                this.readTemplate()
                this.sendSocketNotification("START")
                break
        }
    },

    // Schedule the next update
    scheduleUpdate (delay) {
        if (this.config.debug) { Log.log("Fetch Interval: ", this.config.fetchInterval) }
        let nextLoad = this.config.fetchInterval
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay
        }
        const self = this
        setInterval(() => {
            Log.debug("getting the next batch of data")
            self.getInfo()
        }, nextLoad)
    },

    // Send Socket Notification and start node_helper
    getInfo () {
        if (this.config.debug) { Log.log("selected choice: ", this.config.choice) }
        if (this.config.choice === "headlines") {
            this.sendSocketNotification("headlines", this.config)
        } else if (this.config.choice === "everything") {
            this.sendSocketNotification("everything", this.config)
        } else {
            Log.log("NewsAPI: Invalid choice defined in config/config.js. Use 'headlines' or 'everything'")
            return true
        }
    },

    // Receive Socket Notification
    socketNotificationReceived (notification, payload) {
        if (this.config.debug) { Log.log("payload received: ", JSON.stringify(payload)) }
        if (notification === "NEWSAPI_UPDATE") {
            this.newsArticles = payload
            if (this.firstUpdate === 0) {
                this.firstUpdate = 1
                this.index = 0
                this.draw()
            }
        }
    },

    async readTemplate () {
        const file = this.config.templateFile
        const url = `modules/MMM-NewsAPI/${file}`
        try {
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`A Problem has been encountered retrieving the Template File (${response.statusText})`)
            }
            this.template = await response.text()
        } catch (error) {
            Log.error(error.message)
        }
    },

    draw () {
        clearTimeout(this.timer)
        this.timer = null
        const tag = [
            "sourceId", "author", "content", "description", "articleId",
            "sourceName", "title", "url", "urlToImage", "publishedAt"
        ]
        const article = this.newsArticles[this.index]
        let template = this.template

        for (const i in tag) {
            const t = tag[i]
            const tu = `%${t.toUpperCase()}%`
            template = template.replace(tu, article[t])
        }

        const imgtag = article.urlToImage ? `<img class="articleImage" src="${article.urlToImage}"/>` : ""
        template = template.replace("%ARTICLEIMAGE%", imgtag)
        template = template.replace("%CLASSNAME%", "NEWSAPI") // "NEWS"
        template = template.replace("%AUTHOR%", article.author)
        const news = document.getElementById("NEWSAPI")

        const newsContent = document.getElementById("NEWS_CONTENT")
        news.classList.add("hideArticle")
        news.classList.remove("showArticle")
        for (const j in article) { news.dataset[j] = article[j] }

        setTimeout(() => {
            newsContent.innerHTML = ""
            news.classList.remove("hideArticle")
            news.classList.add("showArticle")
            newsContent.innerHTML = template
            if (this.config.QRCode) {
                const qr = new QRious({
                    element: document.getElementById("NEWSAPI_QRCODE"),
                    value: article.url
                })
            } else {
                const qrCodeElement = document.getElementById("NEWSAPI_QRCODE")
                if (qrCodeElement) {
                    qrCodeElement.parentNode.removeChild(qrCodeElement)
                }
            }
        }, 900)
        this.timer = setTimeout(() => {
            this.index++
            if (this.index >= this.newsArticles.length) { this.index = 0 }
            this.draw()
        }, this.config.drawInterval)
    }
})

