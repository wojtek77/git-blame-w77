import * as vscode from 'vscode';
import { Git } from './Git';
import { GitBlame, BlameData } from './GitBlame';
import { DecorationDataAllClean } from './DecorationDataAllClean';
import { DecorationDataAllDirty } from './DecorationDataAllDirty';
import { StatusBarItemManager } from './StatusBarItemManager';
import { Util } from './Util';
import { DocumentTmpProvider } from './DocumentTmpProvider';

/**
 * Represents blame decoration use in vscode
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class BlameDecoration {
    public static statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000); // only one for all tabs
    public static blameDecorationType = vscode.window.createTextEditorDecorationType({
        before: {
            color: new vscode.ThemeColor('editor.foreground'),
            height: 'editor.lineHeight',
            margin: '0 10px 0 0',
        }
    });
    private static gitBlameUrl?: string; // cache (it is set only once when it is opened workspace)
    private static gitRepositoryType = Git.REPOSITORY_TYPE_NONE; // cache (it is set only once when it is opened workspace)
    
    public activeEditor?: vscode.TextEditor;
    public isOpen: boolean = false;
    public lastSavedVersion?: number; // for clean document
    private readonly workspaceFolder;
    private readonly relativeFile;
    private readonly hash;
    private readonly isDocumentTmp;
    private lastLineCount?: number; // for dirty document
    private isLastOpenCleanDoc?: boolean; // if last time was opened clean document
    private blameData: BlameData[] = []; // cache
    private decoration: vscode.DecorationOptions[] = []; // cache 
    private decorationDirty: vscode.DecorationOptions[] = []; // cache 
    
    public constructor({workspaceFolder, relativeFile, hash}: {workspaceFolder?: string, relativeFile?: string, hash?: string}) {
        this.activeEditor = vscode.window.activeTextEditor;
        const util = Util.getInstance();
        this.workspaceFolder = workspaceFolder || util.workspaceFolder();
        this.relativeFile = relativeFile || util.relativeFile(this.workspaceFolder, this.activeEditor!.document.fileName);
        this.hash = hash;
        this.isDocumentTmp = this.activeEditor?.document.uri.scheme === DocumentTmpProvider.scheme;
        // BlameDecoration.statusBarItem.command = 'gitBlameW77.runGitGuiBlameForFile';
    }
    
    public toggleBlameDecoration() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.openBlameDecoration();
        } else {
            this.activeEditor?.setDecorations(BlameDecoration.blameDecorationType, []);
            BlameDecoration.statusBarItem.hide();
        }
        return this.isOpen;
    }
    
    public async openBlameDecoration() {
        if (this.activeEditor) {
            const decoration = this.activeEditor.document.isDirty
                                ? (this.getDecorationDirty(this.activeEditor.document) || this.decorationDirty)
                                : await this.getDecorationClean(this.activeEditor.document);
            if (decoration) {
                this.activeEditor.setDecorations(BlameDecoration.blameDecorationType, decoration);
                this.updateStatusBarItem(this.activeEditor);
                this.isOpen = true;
            }
        }
    }
    
    public async updateBlameDecoration(contentChanges: readonly vscode.TextDocumentContentChangeEvent[]) {
        if (this.activeEditor) {
            const decoration = this.activeEditor.document.isDirty
                ? this.getDecorationDirty(this.activeEditor.document, contentChanges)
                : await this.getDecorationClean(this.activeEditor.document);
            if (decoration) {
                this.activeEditor.setDecorations(BlameDecoration.blameDecorationType, decoration);
                this.updateStatusBarItem(this.activeEditor);
            }
        }
    }
    
    public async updateStatusBarItem(activeEditor: vscode.TextEditor) {
        if (this.activeEditor) {
            if (this.activeEditor.document.isDirty) {
                BlameDecoration.statusBarItem.hide();
            } else {
                const gitBlameUrl = await this.getGitBlameUrl();
                const gitBlameUrlFn = Git.getInstance().getGitBlameUrlFn(gitBlameUrl, BlameDecoration.gitRepositoryType, this.blameData);
                new StatusBarItemManager(this.isDocumentTmp, this.workspaceFolder, gitBlameUrlFn).show(BlameDecoration.statusBarItem, activeEditor, this.blameData);
            }
        }
    }
    
    private async getDecorationClean(document: vscode.TextDocument) {
        this.isLastOpenCleanDoc = true;
        
        /* use cache */
        if (this.lastSavedVersion === document.version) {
            return this.decoration;
        }
        
        /* for clean document */
        const blameData = await GitBlame.getInstance().getBlameData(this.workspaceFolder, this.relativeFile, this.hash);
        if (blameData === undefined) {
            return;
        }
        this.blameData = blameData;
        const gitBlameUrl = await this.getGitBlameUrl();
        const gitBlameUrlFn = Git.getInstance().getGitBlameUrlFn(gitBlameUrl, BlameDecoration.gitRepositoryType, blameData);
        const decoration = new DecorationDataAllClean(this.isDocumentTmp, this.workspaceFolder, gitBlameUrlFn).getData(document, this.blameData);
        this.decoration = decoration;
        this.lastSavedVersion = document.version;
        return decoration;
    }
    
    private getDecorationDirty(document: vscode.TextDocument, contentChanges?: readonly vscode.TextDocumentContentChangeEvent[]) {
        const isLastOpenCleanDoc = this.isLastOpenCleanDoc;
        this.isLastOpenCleanDoc = false;
        
        if (this.lastLineCount !== document.lineCount) {
            this.lastLineCount = document.lineCount;
            this.decorationDirty = new DecorationDataAllDirty().getData(document);
            return this.decorationDirty;
        } else if (isLastOpenCleanDoc) {
            return this.decorationDirty;
        } else if (contentChanges) { // workaround with wrong present data
            for (let i = 0; i < contentChanges.length; ++i) {
                if (contentChanges[i].text.match(/[\r\n]/)) {
                    return this.decorationDirty;
                }
            }
        }
        // if is in cache return undefined
        return;
    }
    
    private async getGitBlameUrl() {
        if (BlameDecoration.gitBlameUrl === undefined) {
            let gitBlameUrl = vscode.workspace.getConfiguration('gitBlameW77').gitBlameUrl;
            let gitRepositoryType;
            if (gitBlameUrl === null) { // try automatically find URL
                ({gitBlameUrl, gitRepositoryType} = await Git.getInstance().getGitBlameUrl(this.workspaceFolder));
            } else if (gitBlameUrl === '') { // disable URL
                gitRepositoryType = Git.REPOSITORY_TYPE_NONE;
            } else { // own URL
                gitRepositoryType = Git.REPOSITORY_TYPE_OWN;
            }
            BlameDecoration.gitBlameUrl = gitBlameUrl;
            BlameDecoration.gitRepositoryType = gitRepositoryType;
        }
        return BlameDecoration.gitBlameUrl || '';
    }
}
