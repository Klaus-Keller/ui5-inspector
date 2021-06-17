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
                newValue,
            },
            sapui5Version: sap.ui.version,
            type: 'propertyChange',
            isCustomer: false,
            creatingTool: 'ui5inspector',
        };
        const manifest = getApplicationManifest();
        const sChange = flexibilityTools.change.createChangeString(change, manifest);
        return sChange;
    } catch (error) {
        throw Error(
            `Couldn't stringify change.\nControl: '${
                oControl ? oControl.sId : typeof oControl
            }'\nProperty: '${sProperty}'\nValue: '${newValue}'\nError was: '${error.message}'`
        );
    }
}

/**
 * Get the application descriptor aka manifest
 * @returns - manifest, throws error if not found
 */
function getApplicationManifest() {
    let oManifest;
    const mComponents = sap.ui.core.Component.registry.all();
    for (const sComponent in mComponents) {
        const oComponent = mComponents[sComponent];
        try {
            const oCompManifest = oComponent.getManifest();
            if (oCompManifest['sap.app'].type === 'application') {
                oManifest = oCompManifest;
                break;
            }
        } catch (error) {
            console.warn(`Could not read manifest for '${sComponent}'`);
        }
    }
    if (!oManifest) {
        throw Error(`Couldn't receive the application manifest`);
    }
    return oManifest;
}

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
    stringifyChange,
};
