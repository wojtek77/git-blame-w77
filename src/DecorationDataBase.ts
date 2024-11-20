import * as vscode from 'vscode';
import { BlameData } from './GitBlame';
import { Util } from './Util';

/**
 * Base functions for decoration data
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataBase {
    protected workspaceFolder?:string = undefined;
    protected gitBlameUrlFn?: (rec: BlameData) => string;
    protected colors = [];
    protected colorsUsedAsBackground = false;
    protected dateLocale?:string = undefined;
    protected decorationShowHash = true;
    protected hoverEnabled = false;
    protected showLinkToGitGuiBlame = true;
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
                }
            }
        }
        let decorationOptions = this.cache[rec.hash].decorationOptions;
        const color = this._color(rec);
        const prop = this.colorsUsedAsBackground ? 'backgroundColor' : 'color';
        if (decorationOptions[prop] === undefined) {
            decorationOptions[prop] = color;
        } else if (decorationOptions[prop] !== color) { // fix same color for next hash
            // https://stackoverflow.com/questions/28150967/typescript-cloning-object
            decorationOptions = structuredClone(decorationOptions);
            decorationOptions[prop] = color;
        }
        let hoverMessage;
        if (this.hoverEnabled) {
            hoverMessage = this._lineMessage(rec, true, this.showLinkToGitGuiBlame);
        }
        return {
            range: this._range(line),
            renderOptions: {
                before: decorationOptions
            },
            hoverMessage: hoverMessage,
        } as vscode.DecorationOptions;
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
    
    protected _lineMessage(rec: BlameData, showLinkToPrevious: boolean, showLinkToGitGuiBlame: boolean) {
        const util = Util.getInstance();
        /* https://stackoverflow.com/questions/75542879/how-to-add-styled-text-in-vscode-markdownstring */
        const m = new vscode.MarkdownString();
        m.supportHtml = false;
        m.isTrusted = true;
        const hash = rec.hash;
        if (this.gitBlameUrlFn) {
            const gitBlameUrl = this.gitBlameUrlFn(rec);
            m.appendText('Commit: ')
                .appendMarkdown(`[${hash}](${gitBlameUrl})`);
        } else {
            m.appendCodeblock(`Commit: ${hash}`, 'plaintext'); // "plaintext" for better performance
        }
        let text = '';
        if (rec.isDiffAuthorCommitter) {
            const datetimeAuthor = util.datetime(rec.authorTime, this.dateLocale);
            const datetimeCommitter = util.datetime(rec.committerTime, this.dateLocale);
            text += `Author: ${rec.author} <${rec.authorMail}> ${datetimeAuthor}`;
            text += '\n';
            text += `Committer: ${rec.committer} <${rec.committerMail}> ${datetimeCommitter}`;
        } else {
            const datetime = util.datetime(rec.authorTime, this.dateLocale);
            text += `Author: ${rec.author} <${rec.authorMail}> ${datetime}`;
        }
        m.appendCodeblock(text, 'plaintext'); // "plaintext" for better performance
        m.appendCodeblock(`${rec.summary}`, 'plaintext'); // "plaintext" for better performance
        if (rec.previousHash) {
            if (showLinkToPrevious) {
                let args, jsonArgs, uri;
                // showBlamePrevious
                args = {workspaceFolder: this.workspaceFolder, relativeFile: rec.previousFilename, hash: rec.hash, previousHash: rec.previousHash, line: rec.hash_1};
                jsonArgs = JSON.stringify(args);
                uri = vscode.Uri.parse(`command:gitBlameW77.showBlamePrevious?${encodeURI(jsonArgs)}`);
                m.appendText('Previous: ')
                    .appendMarkdown(`[${rec.previousHash}](${uri})`)
                    .appendText(` ${rec.previousFilename}\n`);
                // showBlamePreviousIgnoreRev
                args = {workspaceFolder: this.workspaceFolder, relativeFile: rec.filename, hash: rec.hash, line: rec.hash_1};
                jsonArgs = JSON.stringify(args);
                uri = vscode.Uri.parse(`command:gitBlameW77.showBlamePreviousIgnoreRev?${encodeURI(jsonArgs)}`);
                m.appendMarkdown(`[Previous by Ignore Rev](${uri})`)
                    .appendText(`\n`);
            } else {
                m.appendCodeblock(`\nprevious: ${rec.previousHash} ${rec.previousFilename}`, 'bibtex'); // "bibtex" has grey color
            }
        } else {
            m.appendCodeblock('\nprevious: ---', 'bibtex'); // "bibtex" has grey color
        }
        if (showLinkToGitGuiBlame) {
            m.appendMarkdown(`[Git Gui Blame](command:gitBlameW77.runGitGuiBlameForFile)`)
        }
        
        return m;
    }
    
    private _range(line: number) {
        const pos = new vscode.Position(line, 0);
        const range = new vscode.Range(pos, pos);
        return range;
    }
    
    private _lineText(rec: BlameData) {
        const util = Util.getInstance();
        const noBreakSpace = this._noBreakSpace;
        let text = '';
        if (this.decorationShowHash) {
            text += util.fillAndTruncate(rec.hash, 7, noBreakSpace)+' ';
        }
        text += util.date(rec.authorTime, this.dateLocale)
                +' '
                +util.fillAndTruncate(rec.authorMail, 7, noBreakSpace, '...');
        return text;
    }
    
    private _color(rec: BlameData) {
        if (this.colors.length) {
            if (this.hashColors[rec.hash] === undefined) {
                this.hashColors = {}; // clear all cache (cache work only for lines with the same hash)
                const k = this.j % this.colors.length;
                this.hashColors[rec.hash] = this.colors[k]
                this.j += 1;
            }
            const color = this.hashColors[rec.hash];
            return color;
        }
    }
}
