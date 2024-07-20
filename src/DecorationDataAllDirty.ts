import * as vscode from 'vscode';

/**
 * Represents data of blame decoration (all lines) for dirty document
 * @author Wojciech Brüggemann <wojtek77@o2.pl>
 */
export class DecorationDataAllDirty {
    public getData(document: vscode.TextDocument) {
        const decoration: vscode.DecorationOptions[] = [];
        const linecount = document.lineCount || 0;
        for (let i = 1; i <= linecount; ++i) {
            const startPos = new vscode.Position(i-1, 0);
            const endPos = new vscode.Position(i-1, 0);
            const range = new vscode.Range(startPos, endPos);
            const decorationOptions: vscode.ThemableDecorationAttachmentRenderOptions = {
                contentText: 'document is not saved',
                backgroundColor: 'red'
            };
            const hoverMessage = new vscode.MarkdownString('foo')
    
            decoration.push({
                range: range,
                renderOptions: {
                    before: decorationOptions
                },
                // hoverMessage: hoverMessage
            });
        }

        return decoration;
    }
}
