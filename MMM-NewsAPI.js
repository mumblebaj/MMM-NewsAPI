Module.register("MMM-NewsAPI", {
    // Declare default inputs
    defaults: {
        apiKey: "",
		choice: "headlines",
		pageSize: 20,
		timeFormat: "relative",
		drawInterval: 1000*30,
        fetchInterval: 1000*60*60,
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
    getStles: function() {
        return["MMM-NewsAPI.css"]
    },

    // Declare any translations
    // getTranslations: function() {
    //     return {
    //         en: "translations/en.json",
    //         de: "translations/de.json",
    //         fr: "translations/fr.json",
    //     }
    // },

    // Start process
    start: function() {
        this.firstUpdate = 0
        this.index = 0
        this.timer = null
        this.template = ""
        this.newsArticles = []
        // Start function call to node_helper
        this.getInfo()
        // Schedule the next update
        this.scheduleUpdate()
    },

    getDom: function() {
        var wrapper = document.createElement("div")
        wrapper.id = "NEWS"
        wrapper.className = "horizontal"
        var newsContent = document.createElement("div")
        newsContent.id = "NEWS_CONTENT"
        wrapper.appendChild(newsContent)
        wrapper.classList.add("untouchable")
        return wrapper
    },

    notificationReceived: function(noti, payload) {
        switch (noti) {
            case "DOM_OBJECTS_CREATED":
                this.readTemplate()
                this.sendSocketNotification("START")
                break
        }
    },

    // Schedule the next update
    scheduleUpdate: function(delay) {
        var nextLoad = this.config.fetchInterval
        if (typeof delay !== "undefined"  && delay >= 0) {
            nextLoad = delay
        }
        console.log("Delay till next load", delay)
        var self = this
        setInterval(function() {
            self.getInfo()
        }, nextLoad)
    },

    // Send Socket Notification and start node_helper
    getInfo: function() {
        if (this.config.choice === "headlines"){
            this.sendSocketNotification("headlines", this.config)
        } else if (this.config.choice === "everything") {
            this.sendSocketNotification("everything", this.config)
        } else { 
            console.log("NewsAPI: Invalid choice defined in COnfig") 
            return true
        }
    },

    // Receive Socket Notification
    socketNotificationReceived: function(notification, payload) {
        var self = this
        if (notification === "UPDATE") {
            this.newsArticles = payload
            if (this.firstUpdate == 0) {
                this.firstUpdate = 1
                this.index = 0
                this.draw()
            }
        }
    },

    readTemplate: function() {
        var file = "template.html"
        var url = "modules/MMM-NewsAPI/" + file
        var xmlHttp = new XMLHttpRequest()
        xmlHttp.onreadystatechange = () => {
            var res = []
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) this.template = xmlHttp.responseText
            else if (xmlHttp.status !== 200 && xmlHttp.readyState !== 1) {
                console.log("A Problem has been encountered retrieving the Template FIle", "("+xmlHttp.statusText+")")
            }
        }
        xmlHttp.open("GET", url, true)
        xmlHttp.send()
    },

    draw: function() {
        clearTimeout(this.timer)
        this.timer = null
        const tag = [
            "sourceId", "author", "content", "description", "articleId",
            "sourceName", "title", "url", "urlToImage", "publishedAt"
        ]
        var article = this.newsArticles[this.index]
        var template = this.template

        for (i in tag) {
            var t = tag[i]
            var tu = "%" + t.toUpperCase() + "%"
            template = template.replace(tu, article[t])
        }

        var imgtag = (article.urlToImage) ? `<img class="articleImage" src="` + article.urlToImage + `"/>` : ""
        template = template.replace("%ARTICLEIMAGE%", imgtag)
        var className = (redTitle) ? "" : ""
        template = template.replace("%CLASSNAME%", className)
        template = template.replace("%AUHTOR%", article.author)
        var news = document.getElementById("NEWS")

        var newsContent = document.getElementById("NEWS_CONTENT")
        news.classList.add("hideArticle")
        news.classList.remove("showArticle")
        for (j in article) news.dataset[j] = article[j]

        setTimeout(() => {
            newsContent.innerHTML = ""
            news.classList.remove("hideArticle")
            news.classList.add("showArticle")
            newsContent.innerHTML = template

        }, 900)
        this.timer = setTimeout(() => {
            this.index++
            if (this.index >= this.newsArticles.length) this.index = 0
            this.draw()
        }, this.config.drawInterval)
    }

})