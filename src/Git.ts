import * as vscode from "vscode";
import { BlameData } from "./GitBlame";
import { createHash } from 'crypto';
import path from "path";
import { Util } from "./Util";

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
    
    private static readonly REPOSITORY_TYPE_NONE = 'none';
    private static readonly REPOSITORY_TYPE_OWN = 'own';
    private static readonly REPOSITORY_TYPE_GITHUB = 'github';
    
    private gitBlameUrlCache: {[workspaceFolder: string]: {url: string, type: string}} = {};
    
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
        if (path.sep === '\\') { // if is Windows
            cd = 'cd /d';
        } else {
            cd = 'cd';
        }
        
        // https://stackoverflow.com/questions/4443597/node-js-execute-system-command-synchronously
        try {
            const cdup = Util.getInstance().execSync(`${cd} ${dirname} && git rev-parse --show-cdup`);
            const gitRootDirectory = path.resolve(dirname, cdup);
            return gitRootDirectory;
        } catch (e) {
            throw new Error('No git repository');
        }
    }
    
    public async getGitBlameUrl(workspaceFolder: string) {
        let gitBlameUrl = vscode.workspace.getConfiguration('gitBlameW77').gitBlameUrl;
        let gitRepositoryType;
        if (gitBlameUrl === null) { // try automatically find URL
            ({gitBlameUrl, gitRepositoryType} = await this.getGitBlameUrlFromRep(workspaceFolder));
        } else if (gitBlameUrl === '') { // disable URL
            gitRepositoryType = Git.REPOSITORY_TYPE_NONE;
        } else { // own URL
            gitRepositoryType = Git.REPOSITORY_TYPE_OWN;
        }
        return {gitBlameUrl: gitBlameUrl, gitRepositoryType: gitRepositoryType};
    }
    
    private async getGitBlameUrlFromRep(workspaceFolder: string) {
        if (this.gitBlameUrlCache[workspaceFolder] === undefined) {
            let url, type;
            try {
                const cd = (path.sep === '\\') ? 'cd /d' : 'cd'; // diff between Windows and Linux
                const remoteOriginUrl = await Util.getInstance().execAsync(`${cd} ${workspaceFolder} && git config --get remote.origin.url`);
                [url, type] = this.url(remoteOriginUrl);
            } catch (e) {
                const error = (e as Error);
                if (!error.message.includes('git')) {
                    vscode.window.showErrorMessage(error.message);
                    throw e;
                }
                url = '';
                type = Git.REPOSITORY_TYPE_NONE;
            }
            this.gitBlameUrlCache[workspaceFolder] = {url: url, type: type};
        }
        return {gitBlameUrl: this.gitBlameUrlCache[workspaceFolder].url, gitRepositoryType: this.gitBlameUrlCache[workspaceFolder].type};
    }
    
    private url(remoteOriginUrl: string) {
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
