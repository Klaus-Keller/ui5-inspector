'use strict'

/**
 * Shows one change string
 * @param {string} containerId - id of the DOM container node
 */
function ChangesDetailsView(containerId) {
    this.oContainer = document.getElementById(containerId);
    this.oEditorDOM = document.createElement('div');
    this.oEditorDOM.id = 'changeEditor';
    this.oContainer.appendChild(this.oEditorDOM);

    // Configure ace editor
    this.oEditor = ace.edit('changeEditor');
    this.oEditor.setReadOnly(true)
    this.oEditor.setTheme(chrome.devtools.panels.themeName === 'dark' ? 'ace/theme/vibrant_ink' : 'ace/theme/chrome');
    this.oEditor.session.setUseWrapMode(true);
    this.oEditor.session.setMode('ace/mode/json');
}

ChangesDetailsView.prototype.clear = function() {
    this.oEditor.setValue('', 0);
    this.oEditor.clearSelection();
}

ChangesDetailsView.prototype.update = function(sChange) {
    const newContent = JSON.stringify(JSON.parse(sChange), null, 4);
    this.oEditor.setValue(newContent, 0);
    this.oEditor.clearSelection();
}

module.exports = ChangesDetailsView;