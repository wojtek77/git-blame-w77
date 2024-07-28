import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { Util } from './Util';

/**
 * Base functions for decoration data
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataBase {
    protected colors = [];
    private hashColors: {[key: string]: string} = {};
    private j = 0; // iterator for colors
    
    protected noRecText = '';
    
    private readonly _noBreakSpace = String.fromCharCode(160);
    protected readonly _emptyLine = this._noBreakSpace.repeat(29);
    
    private cache: {[hash: string]: {decorationOptions: vscode.ThemableDecorationAttachmentRenderOptions, hoverMessage?: vscode.MarkdownString}} = {};
    
    protected _lineDecorationRec(rec: BlameData, line: number) {
        if (this.cache[rec.hash]?.decorationOptions === undefined) {
            this.cache[rec.hash] = {
                decorationOptions: {
                    contentText: this._lineText(rec),
                    color: this._color(rec),
                }
            }
        }
        const decorationOptions = this.cache[rec.hash].decorationOptions;
        if (this.cache[rec.hash].hoverMessage === undefined) {
            this.cache[rec.hash].hoverMessage = this._lineHoverMessage(rec);
        }
        const hoverMessage = this.cache[rec.hash].hoverMessage;
        return {
            range: this._range(line),
            renderOptions: {
                before: decorationOptions
            },
            hoverMessage: hoverMessage,
        };
    }
    
    protected _lineDecorationNoRec(line: number) {
        if (this.cache['']?.decorationOptions === undefined) {
            this.cache[''] = {
                decorationOptions: {
                    contentText: this.noRecText,
                }
            }
        }
        const decorationOptions = this.cache[''].decorationOptions;
        return {
            range: this._range(line),
            renderOptions: {
                before: decorationOptions
            },
        };
    }
    
    private _range(line: number) {
        const startPos = new vscode.Position(line, 0);
        const endPos = new vscode.Position(line, 0);
        const range = new vscode.Range(startPos, endPos);
        return range;
    }
    
    private _lineText(rec: BlameData) {
        const util = Util.getInstance();
        const noBreakSpace = this._noBreakSpace;
        return util.fillAndTruncate(rec.hash, 7, noBreakSpace)
                +' '
                /* https://stackoverflow.com/questions/27939773/tolocaledatestring-short-format */
                +util.date(rec.authorTime)
                +' '
                +util.fillAndTruncate(rec.authorMail, 7, noBreakSpace, '...');
    }
    
    private _color(rec: BlameData) {
        if (this.colors.length) {
            if (this.hashColors[rec.hash] === undefined) {
                const k = this.j % this.colors.length;
                this.hashColors[rec.hash] = this.colors[k]
                this.j += 1;
            }
            const color = this.hashColors[rec.hash];
            return color;
        }
    }
    
    private _lineHoverMessage(rec: BlameData) {
        const util = Util.getInstance();
        /* https://stackoverflow.com/questions/75542879/how-to-add-styled-text-in-vscode-markdownstring */
        const m = new vscode.MarkdownString();
        m.supportHtml = true;
        if (rec.isDiffAuthorCommitter) {
            const datetimeAuthor = util.datetime(rec.authorTime);
            const datetimeCommitter = util.datetime(rec.committerTime);
            m.appendMarkdown(`#### author: ${rec.author} <span style="color:#3691ff;">[${rec.authorMail}]()</span> ${datetimeAuthor}`);
            m.appendText('\n');
            m.appendMarkdown(`#### committer: ${rec.committer} <span style="color:#3691ff;">[${rec.committerMail}]()</span> ${datetimeCommitter}`);
            m.appendText('\n');
            m.appendMarkdown(`${rec.hash}`);
        } else {
            const datetime = util.datetime(rec.authorTime);
            m.appendMarkdown(`#### ${rec.author} <span style="color:#3691ff;">[${rec.authorMail}]()</span> ${datetime}`);
            m.appendText('\n');
            m.appendMarkdown(`${rec.hash}`);
        }
        m.appendText('\n');
        m.appendMarkdown(`${rec.summary}`);
        if (rec.previousHash) {
            m.appendText('\n');
            m.appendMarkdown(`previous: <span style="color:#3691ff;">${rec.previousFilename}</span> ${rec.previousHash}`);
        }
        return m;
    }
}
