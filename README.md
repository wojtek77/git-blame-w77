# Git Blame W77

## Description
It is an extension for VS code, which can show git blame in editor and can run git gui blame.

## How to use
1. Press **Alt + B** on the text editor to show or hide the blame decoration
2. To see details of commit hover mouse on the decoration (the option "editor.hover.enabled" have to be enabled)
3. Press **Ctrl + Alt + B** on the text editor to run Git Gui Blame For Line
4. Press **Ctrl + Shift + B** on the text editor to run Git Gui Blame For File

![Git Blame screeshot 1](images/screenshot1.png)

![Git Blame screeshot 2](images/screenshot2.png)

## Commands
| name | description | keybinding |
| - | - | - |
gitBlameW77.toggleBlameDecoration | Toggle Blame Decoration | alt + b
gitBlameW77.runGitGuiBlameForHash | Run Git Gui Blame For Line (hash) | ctrl + alt + b
gitBlameW77.runGitGuiBlameForFile | Run Git Gui Blame For File | ctrl + shift + b

## Configuration
| name | description |
| - | - |
gitBlameW77.colors | Specifies colors for the blame decoration.
```json
    // default colors
    "gitBlameW77.colors": [
        "#17a7ea",
        "#43a965",
        "#ba9286",
        "#cfa84e",
        "#bd6ab9",
        "#8f74e0",
        "#3187f0",
        "#e58965",
        "#e66e84",
        "#7a82da"
    ],

    // gray colors
    "gitBlameW77.colors": [
        "#999",
        "#666"
    ],
    
    // one color "editor.foreground" from theme
    "gitBlameW77.colors": [
    ],
```

## Other
Colors made by [Bluloco Dark Theme](https://marketplace.visualstudio.com/items?itemName=uloco.theme-bluloco-dark) and [Bluloco Dark Muted W77](https://marketplace.visualstudio.com/items?itemName=W77.bluloco-dark-muted-theme-w77)
