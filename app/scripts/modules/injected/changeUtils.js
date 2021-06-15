'use strict';

const flexibilityTools = require('@ui5/flexibility-utils');

/**
 * Create a change string with help of @ui5/flexibility-utils
 * @param {object} oControl - control reference
 * @param {string} property - name of the changed property
 * @param {any} newValue - new property value 
 */
function stringifyChange(oControl, sProperty, newValue) {
    const property = sProperty.charAt(0).toLowerCase() + sProperty.slice(1);
    try {
        const change = {
            controlId: oControl.sId,
            controlType: oControl.getMetadata()._sClassName,
            content: {
                property,
                newValue
            },
            sapui5Version: sap.ui.version,
            type: 'propertyChange',
            isCustomer: false,
            creatingTool: 'ui5inspector'
        }
        const manifest = getManifestFromControl(oControl);
        const sChange = flexibilityTools.change.createChangeString(change, manifest);
        return sChange;
    } catch (error) {
        throw Error(`Couldn't stringify change.\nControl: '${oControl ? oControl.sId : typeof oControl}'\nProperty: '${sProperty}'\nValue: '${newValue}'\nError was: '${error.message}'`);
    }
}

/**
 * Get manifest from control (there might be an easier way to get the component name and manifest from it...)
 * @param {object} oControl - reference to control
 * @returns content of manifest.json as object
 */
function getManifestFromControl(oControl) {
    var manifest;
    if (!oControl) {
        throw Error(`Can't get manifest from control. Passed control has type '${typeof oControl}'`)
    }

    if (typeof oControl.getComponentHandle === 'function') {
        return oControl.getComponentHandle()._oComponent.getInternalManifest();
    }

    var oCandidate = oControl;
    while(oCandidate && oCandidate.getParent()) {
        oCandidate = oCandidate.getParent()
    }
    if (!oCandidate.oContainer) {
        throw Error(`Can't get manifest for for control '${oControl.sId}'. Found root component '${oCandidate.sId}' has no container.`);
    }
    var oContainer = oCandidate.oContainer;
    while(oContainer && oContainer.getParent()) {
        oContainer = oContainer.getParent();
    }

    if (oContainer.oContainer && typeof oContainer.oContainer.getComponent !== 'function') {
        throw Error(`Can't get manifest for for control '${oControl.sId}'. Can't get component for root container '${oContainer.sId}'`);
    }
    var sRootComponent = oContainer.oContainer.getComponent();
    try {
        manifest = sap.ui.getCore().getComponent(sRootComponent).getManifestObject()._oRawManifest;
    } catch (error) {
        throw Error(`Can't get manifest for for control '${oControl.sId}'. Error while reading manifest data from root component with id '${sRootComponent}'. Error was: '${error.message}'`);
    }
    if (!manifest) {
        throw Error(`Can't get manifest for for control '${oControl.sId}'.`);
    }
    return manifest;
};

/**
 * Export changes to local file system (let user pick a directory)
 * This doesn't work from the developers tools, so it is done here in injected code
 * @param {string[]} changes - stringified changes
 */
 async function exportChanges(changes) {
    const dirHandle = await window.showDirectoryPicker();
    if (!dirHandle) {
        return;
    }
    for (const change of changes) {
        const oChange = JSON.parse(change);
        const fileHandle = await dirHandle.getFileHandle(`${oChange.fileName}.${oChange.fileType}`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(oChange, null, 4));
        await writable.close();
        console.log(`File '${fileHandle.name}' written`);
    }
}

module.exports = {
    exportChanges,
    stringifyChange
};