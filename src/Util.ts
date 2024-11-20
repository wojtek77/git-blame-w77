import * as vscode from 'vscode';
import { Git } from './Git';
import path from 'path';
import { exec, ExecOptions, execSync, ExecSyncOptionsWithStringEncoding, spawn } from 'child_process';
import { ObjectEncodingOptions } from 'fs';

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
                return folder.uri.fsPath + path.sep;
            }
            // looking in git
            const dirname = this.dirname(editor.document.fileName);
            const gitRootDirectory = Git.getInstance().getGitRootDirectory(dirname);
            return gitRootDirectory + path.sep;
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
    
    /**
     * Run command by exec sync
     * @param cmd 
     * @param options 
     * @returns 
     */
    public execSync(cmd: string, options: ExecSyncOptionsWithStringEncoding = {encoding: 'utf8', timeout: 10000}): string {
        let result = execSync(cmd, options);
        result = result.replace(/\n$/, '');
        return result;
    }
    
    /**
     * Run command by exec async
     * https://gist.github.com/miguelmota/e8fda506b764671745852c940cac4adb
     * @param cmd 
     * @param options 
     * @returns 
     */
    public execAsync(cmd: string, options: (ObjectEncodingOptions & ExecOptions) | undefined | null = {encoding: 'utf8'}): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(cmd, options, (error, stdout, stderr) => {
                if (error) return reject(error);
                if (stderr) return reject(stderr);
                resolve((stdout as string).replace(/\n$/, ''));
            });
        })
    }
    
    /**
     * Run command by spawn async
     * https://stackoverflow.com/questions/69704190/node-child-process-spawn-is-not-returning-data-correctly-when-using-with-funct
     * @param cmd 
     * @param args 
     * @returns 
     */
    public spawnAsync(cmd: string, args?: any): Promise<string> {
        return new Promise((resolve, reject) => {
            let buf = '';
            let err = '';
            const child = spawn(cmd, args);

            child.stdout.on('data', (data: string) => {
                buf += data;
            });
            child.stderr.on('data', (data: string) => {
                err += data;
            });
            child.on('close', (code: number) => {
                if (code !== 0) {
                    return reject(new Error(err));
                }
                resolve(buf);
            });
        });
    }
}
