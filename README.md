# Git Blame W77

## Description
It is an extension for VS code, which can show git blame in editor and can run git gui blame.

## How to use
1. Press **Alt + B** on the text editor to show or hide the blame decoration
2. To see details of commit hover mouse on the decoration
3. Press **Ctrl + Alt + B** on the text editor to run Git Gui Blame For Line
4. Press **Ctrl + Shift + B** on the text editor to run Git Gui Blame For File

![Git Blame screeshot 1](images/screenshot1.png)

![Git Blame screeshot 2](images/screenshot2.png)

![Git Blame screeshot 3](images/screenshot3.png)

![Git Blame screeshot 4](images/screenshot4.png)

## Commands
| name | description | keybinding |
| - | - | - |
gitBlameW77.toggleBlameDecoration | Toggle Blame Decoration | alt + b
gitBlameW77.runGitGuiBlameForHash | Run Git Gui Blame For Line (hash) | ctrl + alt + b
gitBlameW77.runGitGuiBlameForFile | Run Git Gui Blame For File | ctrl + shift + b

## Configuration
| name | description |
| - | - |
gitBlameW77.colors | Specifies colors for the blame decoration. If use empty array then is setup color 'editor.foreground' from theme.

## Other
Colors made by [Bluloco Dark Theme](https://marketplace.visualstudio.com/items?itemName=uloco.theme-bluloco-dark).
