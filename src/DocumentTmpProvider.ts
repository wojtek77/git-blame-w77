import * as vscode from 'vscode';
import { GitShow } from './GitShow';
import { GitBlame } from './GitBlame';

/**
 * Document tmp provider
 * https://code.visualstudio.com/api/extension-guides/virtual-documents
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DocumentTmpProvider implements vscode.TextDocumentContentProvider {
    private static instance: DocumentTmpProvider;
    
    static getInstance() {
        if (!this.instance) {
            this.instance = new DocumentTmpProvider();
        }
        return this.instance;
    }
    
    public static readonly scheme = 'gitBlameW77.documentTmp';
    
    private fnGetContent: any;
    
    public async createDocBlamePrevious(workspaceFolder: string, relativeFile: string, hash: string, previousHash: string, line: number) {
        this.fnGetContent = async () => {
            const content = await GitShow.getInstance().getFileContent(workspaceFolder, relativeFile, previousHash);
            return content;
        };
        
        // search correct line in document
        const extraCmd = `--ignore-rev ${hash}`;
        try {
            const blameData = await GitBlame.getInstance().getBlameData(workspaceFolder, relativeFile, hash+'^!', line, extraCmd, false);
            if (blameData !== undefined) {
                line = blameData[1].hash_1;
            }
        } catch (e) {}
        
        /* https://code.visualstudio.com/api/extension-guides/virtual-documents */
        const uri = vscode.Uri.parse(DocumentTmpProvider.scheme + ':' + relativeFile + ' @ ' + previousHash.substring(0,7));
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
    
    public async createDocBlamePreviousIgnoreRev(workspaceFolder: string, relativeFile: string, hash: string, line: number) {
        const extraCmd = `--ignore-rev ${hash}`;
        const blameData = await GitBlame.getInstance().getBlameData(workspaceFolder, relativeFile, hash, line, extraCmd);
        if (blameData === undefined) {
            return;
        }
        let relativeFilePrevious, hashPrevious, linePrevious;
        if (blameData[1].hash !== hash) { // find previous
            relativeFilePrevious = blameData[1].filename;
            hashPrevious = blameData[1].hash;
            linePrevious = blameData[1].hash_1;
        } else {
            relativeFilePrevious = blameData[1].previousFilename;
            hashPrevious = blameData[1].previousHash;
            linePrevious = blameData[1].hash_1;
        }
        if (!relativeFilePrevious || !hashPrevious) {
            return;
        }
        
        this.fnGetContent = async () => {
            const content = await GitShow.getInstance().getFileContent(workspaceFolder, relativeFilePrevious, hashPrevious);
            return content;
        };
        
        /* https://code.visualstudio.com/api/extension-guides/virtual-documents */
        const uri = vscode.Uri.parse(DocumentTmpProvider.scheme + ':' + relativeFilePrevious + ' @ ' + hashPrevious.substring(0,7));
        const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
        if (linePrevious >= doc.lineCount) {
            linePrevious = (doc.lineCount > 1) ? doc.lineCount-1 : 1;
        }
        const showDocOptions = {
            preserveFocus: false,
            preview: false,
            // viewColumn: 1,
            selection: new vscode.Range(linePrevious-1, 0, linePrevious-1, 0),
        };
        await vscode.window.showTextDocument(doc, showDocOptions);
        return {relativeFilePrevious: relativeFilePrevious, hashPrevious: hashPrevious}
    }
    
    public async provideTextDocumentContent(uri: vscode.Uri) {
        return this.fnGetContent();
    }
}
