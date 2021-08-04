# MMM-NewsAPI


A [MagicMirror²](https://magicmirror.builders) module to to get news from [NewsAPi.org](https://newsapi.org/).

[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

![Example](screen1.PNG) 

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/mumblebaj/MMM-NewsAPI.git
````

Add the module to the modules array in the `config/config.js` file:
````javascript
  {
			module: "MMM-NewsAPI",
			header: "NEWS",
			position: "bottom_bar",
  },
````

## Configuration options

The following properties can be configured:


| Option                       | Description
| ---------------------------- | -----------
| `header`                     | The header text <br><br> **Default value:** `'NEWS'`
| `choice`                     | Type of query to be instantiated <br><br> **Possible values:** `headlines` or `everything` <br> **Default value:** `headlines`
| `pageSize`                   | The number of articles to be returned. Max = 100 <br> **Default value:** `20`
| `drawInterval`               | The amount of time each article is displayed <br> **Default value:** `30 seconds`
| `fetchInterval`              | The time interval between fetching new articles. There is a daily limit of 100 calls per apiKey 
| `apiKey`                     | You can obtain an API Key from [NewsAPi.org](https://newsapi.org/)

## Query Options

The following query options can be defined

| Option                       | Description
| ---------------------------- | -----------
| `country`                    | The 2-letter ISO 3166-1 code of the country you want to get headlines for. <br>Possible options: <br> `ae` `ar` `at` `au` `be` `bg` `br` `ca` `ch` `cn` <br> `co` `cu` `cz` `de` `eg` `fr` `gb` `gr` `hk` `hu` `id` `ie` `ve` `za` <br> `il` `in` `it` `jp` `kr` `lt` `lv` `ma` `mx` `my` `ng` `nl` <br> `no` `nz` `ph` `pl` `pt` `ro` `rs` `ru` `sa` `se` `sg` `si` <br> `sk` `th` `tr` `tw` `ua` `us`. <br> **Note: you can't mix this param with the sources param**
| `category`                   | The category you want to get headlines for. <br> Possible options: `business` `entertainment` `general` `health` `science` `sports` `technology`. <br> **Note: you can't mix this param with the sources param.**
| `q`                          | Keywords or phrases to search for in the article title and body
| `qInTitle`                   | Keywords or phrases to search for in the article title only
| `sources`                    | A comma-seperated string of identifiers (maximum 20) for the news sources or blogs you want headlines from 
| `domains`                    | A comma-seperated string of domains (eg bbc.co.uk, techcrunch.com, engadget.com) to restrict the search to.
| `excludeDomains`             | A comma-seperated string of domains (eg bbc.co.uk, techcrunch.com, engadget.com) to remove from the results.
| `language`                   | The 2-letter ISO-639-1 code of the language you want to get headlines for. Possible options: <br> `ar` `de` `en` `es` `fr` `he` `it` `nl` `no` `pt` `ru` `se` `ud` `zh`


## Config Example

````javascript
  {
			module: "MMM-NewsAPI",
			header: "news",
			position: "top_bar",
			config: {
				apiKey: "",
				type: "horizontal",
				choice: "headlines",
				pageSize: 20,
				drawInterval: 1000*30,
				fetchInterval: 1000*60*60,
				query: {
						country: "fr",
						category: "",
						q: "",
						qInTitle: "",
						sources: "",
						domains: "",
						excludeDomains: "",
						language: ""
				}
			}
  },
````
**Notes** 
* `apiKey` is **required**. You should first create an account on https://newsapi.org/ 

## Updating

To update the module to the latest version, use your terminal to go to your MMM-NewsAPI module folder and type the following command:

````
git pull
```` 

