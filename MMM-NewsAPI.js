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
        drawInterval: 1000*30,
        fetchInterval: 1000*60*60,
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
    getStyles: function() {
        return [this.file("MMM-NewsAPI.css")]
    },
    
    // Import QR code script file
    getScripts: function() {
        return ["https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"];
    },

    // Start process
    start: function() {
        this.firstUpdate = 0
        this.index = 0
        this.timer = null
        this.template = ""
        suspended = false;
        this.newsArticles = []
        if (this.config.debug) Log.log("config: ", JSON.stringify(this.config))
        // Start function call to node_helper
        this.getInfo()
        // Schedule the next update
        this.scheduleUpdate()
    },

    stop: function () {
        Log.info('Stopping module ' + this.name);
      },
    
      resume: function () {
        Log.info('Resuming module ' + this.name);
        Log.debug('with config: ' + JSON.stringify(this.config));
        this.suspended = false;
        this.updateDom()
      },
    
      suspend: function () {
        Log.info('Suspending module ' + this.name);
        this.suspended = true;
      },

    getDom: function() {
        var wrapper = document.createElement("div")
        wrapper.id = "NEWSAPI"
        wrapper.className = this.config.type
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
        if (this.config.debug) Log.log("Fetch Interval: ", this.config.fetchInterval)
        var nextLoad = this.config.fetchInterval
        if (typeof delay !== "undefined"  && delay >= 0) {
            nextLoad = delay
        }
        var self = this
        setInterval(function() {
            //if (this.config.debug) Log.log("getting the next batch of data")
            self.getInfo()
        }, nextLoad)
    },

    // Send Socket Notification and start node_helper
    getInfo: function() {
        if (this.config.debug) Log.log("selected choice: ", this.config.choice)
        if (this.config.choice === "headlines"){
            this.sendSocketNotification("headlines", this.config)
        } else if (this.config.choice === "everything") {
            this.sendSocketNotification("everything", this.config)
        } else {
            console.log("NewsAPI: Invalid choice defined in config/config.js. Use 'headlines' or 'everything'")
            return true
        }
    },

    // Receive Socket Notification
    socketNotificationReceived: function(notification, payload) {
        if (this.config.debug) Log.log("payload received: ", JSON.stringify(payload))
        var self = this
        if (notification === "NEWSAPI_UPDATE") {
            this.newsArticles = payload
            if (this.firstUpdate == 0) {
                this.firstUpdate = 1
                this.index = 0
                this.draw()
            }
        }
    },

    readTemplate: function() {
        var file = this.config.templateFile
        var url = "modules/MMM-NewsAPI/" + file
        var xmlHttp = new XMLHttpRequest()
        xmlHttp.onreadystatechange = () => {
            var res = []
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) this.template = xmlHttp.responseText
            else if (xmlHttp.status !== 200 && xmlHttp.readyState !== 1) {
                console.log("A Problem has been encountered retrieving the Template File", "("+xmlHttp.statusText+")")
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
        var className = (article.className) ? article.className : ""
        template = template.replace("%CLASSNAME%", 'NEWSAPI') //"NEWS"
        template = template.replace("%AUTHOR%", article.author)
        var news = document.getElementById("NEWSAPI")

        var newsContent = document.getElementById("NEWS_CONTENT")
        news.classList.add("hideArticle")
        news.classList.remove("showArticle")
        for (j in article) news.dataset[j] = article[j]

        setTimeout(() => {
            newsContent.innerHTML = ""
            news.classList.remove("hideArticle")
            news.classList.add("showArticle")
            newsContent.innerHTML = template
            if (this.config.QRCode) {
                var qr = new QRious({
                    element: document.getElementById('NEWSAPI_QRCODE'),
                    value: article.url
                });
            }
        }, 900)
        this.timer = setTimeout(() => {
            this.index++
            if (this.index >= this.newsArticles.length) this.index = 0
            this.draw()
        }, this.config.drawInterval)
    }

})
