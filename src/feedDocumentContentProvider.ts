import { TextDocumentContentProvider, Uri, Event, CancellationToken, EventEmitter, ExtensionContext, workspace } from "vscode";
import { Feed, fetchFeed } from "./feed";

interface FeedService {
    address: string;
    lastUpdate: Date;
    feeds: Feed[];
}

export class FeedDocumentContentProvider implements TextDocumentContentProvider {
    private _service: FeedService = {
        address: "https://www.v2ex.com/index.xml",
        lastUpdate: null,
        feeds: null
    };
    private _expireDuration: number = 20 * 60 * 1000;
    private _changeEvent = new EventEmitter<Uri>();

    public constructor(expireDuration?: number) {
        if (expireDuration) {
            this._expireDuration = expireDuration;
        }
    }

    public get onDidChange(): Event<Uri> {
        return this._changeEvent.event;
    }

    public provideTextDocumentContent(uri: Uri, token: CancellationToken): Promise<string> {
        let feeds = this._service.feeds;
        if (feeds) {
            if ((Date.now() - this._service.lastUpdate.valueOf()) > this._expireDuration) {
                this._service.lastUpdate = this._service.feeds = null;
            } else {
                return Promise.resolve(this._renderFeeds(feeds));
            }
        }

        let loading = Promise.resolve("<div> Loading... </div>");
        loading.then(() => fetchFeed(this._service.address).then(feeds => {
                this._service.feeds = feeds;
                this._service.lastUpdate = new Date();
                this._changeEvent.fire(uri);
            }));
        return loading;
    }

    public register(ctx: ExtensionContext, scheme: string) {
        let disposable = workspace.registerTextDocumentContentProvider(scheme, this);
        ctx.subscriptions.push(disposable);
    }

    private _renderFeeds(feeds: Feed[]): string {
        let content = "";
        for (let feed of feeds) {
            content += this._renderFeed(feed);
        }
        return content;
    }

    private _renderFeed(feed: Feed): string {
        return `
<div style="border: 1px dashed; margin: 50px; padding: 0 20px 20px 20px;">
    <h2><a href="${feed.link}">${feed.title}</a></h2>
    <p style="margin-bottom: 20px;">${feed.author.name} 发表于 ${feed.published}</p>
    <div>${feed.content ? feed.content : ""}</div>
</div>
`;
    }
}
