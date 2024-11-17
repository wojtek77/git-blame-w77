import * as vscode from 'vscode';
import { Git } from './Git';
import path from 'path';

/**
 * Any simple util functions
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class Util {
    private static instance: Util;
    
    static getInstance() {
        if (!this.instance) {
            this.instance = new Util();
        }
        return this.instance;
    }
    
    private readonly sep = path.sep;
    
    public dirname(filePath: string): string {
        const basename = this.basename(filePath);
        return filePath.replace(basename, '');
    }
    
    public basename(filePath: string): string {
        const match = filePath.match(/[^/\\]+$/);
        return match ? match[0] : '';
    }
    
    public workspaceFolder(): string {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const res = editor.document.uri;
            const folder = vscode.workspace.getWorkspaceFolder(res);
            if (folder) {
                return folder.uri.fsPath + this.sep;
            }
            // looking in git
            const dirname = this.dirname(editor.document.fileName);
            const gitRootDirectory = Git.getInstance().getGitRootDirectory(dirname);
            return gitRootDirectory + this.sep;
        }
        throw new Error('Is not open any document');
    }
    
    public relativeFile(workspaceFolder: string, filePath: string): string {
        return filePath.substring(workspaceFolder.length);
    }
    
    /**
     * Truncate string alternatively can add extra text
     * https://stackoverflow.com/questions/1199352/smart-way-to-truncate-long-strings
     * @param str
     * @param maxLength
     * @param extraText
     * @return
     */
    public truncate(str: string, maxLength: number, extraText = '') {
        return (str.length > maxLength) ? str.slice(0, maxLength) + extraText : str;
    };
    
    /**
     * Fill and truncate string alternatively can add extra text
     * this function make every string for the same length
     * @param str 
     * @param maxLength 
     * @param fillString 
     * @param extraText 
     * @return
     */
    public fillAndTruncate(str: string, maxLength: number, fillString: string, extraText = '') {
        return this.truncate(str.padEnd(maxLength, fillString), maxLength, extraText);
    };
    
    /**
     * Return date in format yyyy-mm-dd
     * https://stackoverflow.com/questions/27939773/tolocaledatestring-short-format
     * @param timestamp 
     * @param locale
     * @return string
     */
    public date(timestamp: number, locale: string | undefined) {
        return new Date(timestamp * 1000).toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour12: false
        });
    }

    /**
     * Return datetime in format yyyy-mm-dd hh:mm:ss
     * https://stackoverflow.com/questions/27939773/tolocaledatestring-short-format
     * @param timestamp
     * @param locale
     * @return string
     */
    public datetime(timestamp: number, locale: string | undefined) {
        return new Date(timestamp * 1000).toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }
}
