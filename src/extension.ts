'use strict';
import * as vscode from 'vscode';
import { FeedDocumentContentProvider } from './feedDocumentContentProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-v2ex" is now active!');

    const v2ex = new FeedDocumentContentProvider();
    v2ex.register(context, "v2ex");

    let disposable = vscode.commands.registerCommand('v2ex.explore', async () => {
        await vscode.commands.executeCommand("vscode.previewHtml", vscode.Uri.parse("v2ex://"), vscode.ViewColumn.One, "V2EX");
    });

    context.subscriptions.push(disposable);
}
