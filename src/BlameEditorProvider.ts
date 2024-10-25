import * as vscode from 'vscode';
import { GitShow } from './GitShow';

/**
 * Blame editor provider
 * https://code.visualstudio.com/api/extension-guides/virtual-documents
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class BlameEditorProvider implements vscode.TextDocumentContentProvider {
    private static instance: BlameEditorProvider;
    
    static getInstance() {
        if (!this.instance) {
            this.instance = new BlameEditorProvider();
        }
        return this.instance;
    }
    
    public static readonly scheme = 'gitBlameW77.BlameEditor';
    
    private workspaceFolder = '';
    private relativeFile = '';
    private hash = '';
    
    public async createDoc(workspaceFolder: string, relativeFile: string, hash: string, line: number) {
        this.workspaceFolder = workspaceFolder;
        this.relativeFile = relativeFile;
        this.hash = hash;
        /* https://code.visualstudio.com/api/extension-guides/virtual-documents */
        const uri = vscode.Uri.parse(BlameEditorProvider.scheme + ':' + relativeFile + ' @ ' + hash.substring(0,7));
        const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
        if (line >= doc.lineCount) {
            line = (doc.lineCount > 1) ? doc.lineCount-1 : 1;
        }
        const showDocOptions = {
            preserveFocus: false,
            preview: false,
            // viewColumn: 1,
            selection: new vscode.Range(line-1, 0, line-1, 0),
        };
        await vscode.window.showTextDocument(doc, showDocOptions);
    }
    
    public async provideTextDocumentContent(uri: vscode.Uri) {
        const content = await GitShow.getInstance().getFileContent(this.workspaceFolder, this.relativeFile, this.hash);
        return content;
    }
}
