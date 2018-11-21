var request = require("request");
var FeedParser = require("feedparser");

export interface Feed {
    title: string;
    link: string;
    published: Date;
    updated: Date;
    author: {
        name: string;
        uri: string;
    };
    content: string | undefined;
}

export async function fetchFeed(address: string): Promise<Feed[]> {
    return new Promise<Feed[]>((resolve, reject) => {
        let feeds: Feed[] = [];
        let reqStream = request(address);
        let parserStream = new FeedParser();

        reqStream.on('error', reject);
        reqStream.on('response', (res: any) => {
            if (res.statusCode !== 200) {
                reqStream.emit('error', new Error('Bad status code'));
            }
            reqStream.pipe(parserStream);
        });

        parserStream.on('error', reject);
        parserStream.on('readable', () => {
            let item: any = null;
            while (item = parserStream.read()) {
                feeds.push({
                    title: item.title,
                    link: item.link,
                    published: new Date(item["atom:published"]["#"]),
                    updated: new Date(item["atom:updated"]["#"]),
                    author: {
                        name: item["atom:author"]["name"]["#"],
                        uri: item["atom:author"]["uri"]["#"],
                    },
                    content: item["atom:content"]["#"],
                });
            }
        });
        parserStream.on("end", () => {
            resolve(feeds);
        });
    });
}
