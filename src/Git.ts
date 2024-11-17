import * as vscode from "vscode";
import { Util } from "./Util";
import { BlameData } from "./GitBlame";
import { createHash } from 'crypto';
import { execSync } from "child_process";

/**
 * Represents function for git repository
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class Git {
    private static instance: Git;
    static getInstance() {
        if (!this.instance) {
            this.instance = new Git();
        }
        return this.instance;
    }
    
    public static readonly REPOSITORY_TYPE_NONE = 'none';
    public static readonly REPOSITORY_TYPE_OWN = 'own';
    public static readonly REPOSITORY_TYPE_GITHUB = 'github';
    
    public getGitBlameUrlFn(gitBlameUrl: string, gitRepositoryType: string, blameData: BlameData[]) {
        switch (gitRepositoryType) {
            case Git.REPOSITORY_TYPE_OWN:
                return (rec: BlameData) => {
                    return gitBlameUrl.replace('${hash}', rec.hash);
                };
            case Git.REPOSITORY_TYPE_GITHUB:
                const rec = blameData[1];
                // https://remarkablemark.medium.com/how-to-generate-a-sha-256-hash-with-javascript-d3b2696382fd
                const fileHash = createHash('sha256').update(rec.filename).digest('hex');
                return (rec: BlameData) => {
                    return `${gitBlameUrl}/commit/${rec.hash}#diff-${fileHash}R${rec.hash_1}`;
                };
            default:
                return undefined;
        }
    }

    public getGitRootDirectory(dirname: string) {
        let cd;
        if (dirname.match(/[\\]/)) { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }
        
        // https://stackoverflow.com/questions/4443597/node-js-execute-system-command-synchronously
        try {
            const gitRootDirectory = execSync(`${cd} ${dirname} && git rev-parse --show-toplevel`, {encoding: 'utf8', timeout: 10000});
            return gitRootDirectory.replace(/\n$/, '');
        } catch (e) {
            throw new Error('No git repository');
        }
    }
    
    public async getGitBlameUrl(workspaceFolder: string) {
        let cd;
        if (workspaceFolder.match(/[\\]/)) { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }

        const util = require('util');
        const exec = util.promisify(require('child_process').exec);
        try {
            const { stdout, stderr } = await exec(`${cd} ${workspaceFolder} && git config --get remote.origin.url`);
            const [url, type] = this.url(stdout);
            return {gitBlameUrl: url, gitRepositoryType: type};
        } catch (e) {
            const error = (e as Error);
            if (!error.message.includes('git')) {
                vscode.window.showErrorMessage(error.message);
                throw e;
            }
        }
        return {gitBlameUrl: '', gitRepositoryType: Git.REPOSITORY_TYPE_NONE};
    }
    
    private url(stdout: string) {
        const remoteOriginUrl = stdout.trimEnd();
        let url, s, type;
        switch (true) {
            case remoteOriginUrl.includes('git@github.com:'):
                const a = remoteOriginUrl.split(':');
                s = a[1].replace(/\.git$/, '');
                url = `https://github.com/${s}`;
                type = Git.REPOSITORY_TYPE_GITHUB
                return [url, type];
            case remoteOriginUrl.includes('https://github.com/'):
                s = remoteOriginUrl.replace('https://github.com/', '').replace(/\.git$/, '');
                url = `https://github.com/${s}`;
                type = Git.REPOSITORY_TYPE_GITHUB
                return [url, type];
            default:
                return ['', Git.REPOSITORY_TYPE_NONE];
        }
    }
}
