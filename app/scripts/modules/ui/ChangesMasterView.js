const DataGrid = require('../ui/datagrid/DataGrid.js');
const UIUtils = require('./datagrid/UIUtils.js');

/**
 * Columns to show in data grid
 */
const columns = [{
        id: 'name',
        title: 'Name',
        sortable: false,
        align: undefined,
        nonSelectable: false,
        weight: 22,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        disclosure: true,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('name', a, b);
        }
    },
    {
        id: 'controlId',
        title: 'Control Id',
        sortable: false,
        align: undefined,
        nonSelectable: false,
        weight: 40,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        disclosure: true,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('name', a, b);
        }
    },
    {
        id: 'type',
        title: 'Type',
        sortable: false,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        disclosure: true,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('name', a, b);
        }
    },
    {
        id: 'property',
        title: 'Property',
        sortable: false,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        disclosure: true,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('name', a, b);
        }
    },
    {
        id: 'value',
        title: 'Value',
        sortable: false,
        align: undefined,
        nonSelectable: false,
        weight: 20,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        disclosure: true,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('name', a, b);
        }
    },
    {
        id: 'change',
        title: 'Change',
        sortable: false,
        align: undefined,
        nonSelectable: false,
        weight: 10,
        visible: true,
        allowInSortByEvenWhenHidden: false,
        /**
         * Sorts Items.
         * @param {Object} a
         * @param {Object} b
         */
        sortingFunction: function (a, b) {
            return DataGrid.SortableDataGrid.StringComparator('content', a, b);
        }
    }];

/** 
 * Array of serialized changes
*/
const changesStore = [];

/**
 * Changes view implementation to show what property changes have been done. Allows also to trigger clear and export functionality
 * @param {string} domId - id of the HTML DOM node for the changes master view
 * @param {object} options - options for the view, e.g. event handlers 'onSelectChange', 'onClearChanges', 'onExportChanges'
 */
function ChangesMasterView(domId, options) {
    // Define handler, either provided in options or nop implementation
    for (const handlerName of ['onSelectChange', 'onClearChanges', 'onExportChanges']) {
        this[handlerName] = options && typeof options[handlerName] == 'function' ? options[handlerName] : function () {};
    }

    // Create UI
    this.changesTabDOM = document.getElementById('changes');
    this.oDataGrid = this._createDataGrid();

    const oContainerDOM = document.getElementById(domId); 
    oContainerDOM.appendChild(this._createExportButton());
    oContainerDOM.appendChild(this._createClearButton());    
    oContainerDOM.appendChild(this.oDataGrid.element);
}

ChangesMasterView.prototype._createExportButton = function () {
    const oIcon = UIUtils.Icon.create('', 'toolbar-glyph hidden');
    oIcon.setIconType('largeicon-store');
    oIcon.onclick = () => {
        if (changesStore.length > 0) {
            this.onExportChanges(changesStore);
        }
    }
    return oIcon;
};

ChangesMasterView.prototype._createClearButton = function () {
    const oIcon = UIUtils.Icon.create('', 'toolbar-glyph hidden');
    oIcon.setIconType('largeicon-clear');
    oIcon.onclick = () => {
        this.oDataGrid.rootNode().removeChildren();
        changesStore.splice(0, changesStore.length);
        this.updateTabName();
        this.onClearChanges();
    };
    return oIcon;
};

ChangesMasterView.prototype._createDataGrid = function() {
    const oDataGrid = new DataGrid.SortableDataGrid({
        displayName: 'Changes',
        columns
    });

    oDataGrid.addEventListener(DataGrid.Events.SelectedNode, this.selectHandler, this);

    /**
     * Resize Handler for DataGrid.
     */
     const oResizeObserver = new ResizeObserver(function () {
        oDataGrid.onResize();
    });
    oResizeObserver.observe(oDataGrid.element);

    return oDataGrid;
};

/**
 * Adds a change to the data grid as new row and stores it also in changesStore
 * @param {string} change - serialized change
 */
ChangesMasterView.prototype.logChange = function (change) {
    const oChange = JSON.parse(change);
    const data = {
        name: oChange.fileName,
        controlId: oChange.selector.id,
        type: oChange.selector.type,
        property: oChange.content.property,
        value: oChange.content.newValue,
        change,
    }
    const oNode = new ChangeNode(data);
    this.oDataGrid.insertChild(oNode);
    changesStore.push(change);
    this.updateTabName();
};

/**
 * Update tab header text to show number of changes
 */
ChangesMasterView.prototype.updateTabName = function () {
    try {
        this.changesTabDOM.innerText = changesStore.length > 0 ? `Changes (${changesStore.length})` : 'Changes';
    } catch(error) {
        console.warn(error);
    }
};

/**
 * Selects clicked change entry.
 * @param {Object} oEvent
 */
 ChangesMasterView.prototype.selectHandler = function (oEvent) {
    if (oEvent.data && oEvent.data.data && oEvent.data.data.change) {
        this.onSelectChange(oEvent.data.data.change);
    }
};


/**
 * Class for a single cell in the data grid, inherit from SortableDataGridNode
 */
class ChangeNode extends DataGrid.SortableDataGridNode {

    createCell(columnId) {
        const cell = super.createCell(columnId);
        if (columnId === 'name') {
            this._renderPrimaryCell(cell, columnId);
        }

        return cell;
    }

    _renderPrimaryCell(cell) {
        cell.title = this.data.name;
    }
};

module.exports = ChangesMasterView;