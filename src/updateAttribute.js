import {
  getEventName,
  isEventAttribute,
  RESERVED_ATTRIBUTES,
} from './utils';

import { setRef } from './refs';

import {
  getEffectiveEventName,
  getInputStateType,
  handleInputProperty,
  getPatchedEventHandler,
  eventHandlerCache,
} from './reactEvents';

function isAttrOverridden (tagAttrs, attrName, attrIndex) {
  const lastIndex = tagAttrs.lastIndexOf(attrName);
  return lastIndex !== -1 && lastIndex !== attrIndex;
}

function setAttribute (node, attrName, attrValue, oldAttrValue, isSvgAttribute) {
  /*
      if node has property with attribute name, set the value directly as property
      otherwise set it as attribute
    */

  const isEventAttr = isEventAttribute(attrName);
  if ((attrName in node && !isSvgAttribute) || isEventAttr) {
    const inputStateType = getInputStateType(node);
    /*
       if it is a property check if it is a event callback
       or other property and handle it accordingly
      */
    if (isEventAttr) {
      let eventName = getEventName(attrName);
      eventName = getEffectiveEventName(eventName, node);
      const patchedEventHandler = getPatchedEventHandler(node, attrValue);

      // remove old event and assign it again
      if (oldAttrValue) {
        const oldPatchedHandler = eventHandlerCache.get(oldAttrValue) || oldAttrValue;
        node.removeEventListener(eventName, oldPatchedHandler);
      }

      node.addEventListener(eventName, patchedEventHandler);
    } else if (inputStateType) {
      handleInputProperty(inputStateType, node, attrName, attrValue);
    } else {
      // if attribute is value property
      node[attrName] = attrValue;
    }
  } else {
    attrName = attrName.toLowerCase();

    if (isSvgAttribute) {
      node.setAttributeNS(null, attrName, attrValue);
    } else {
      node.setAttribute(attrName, attrValue);
    }
  }
}

export default function updateAttribute (part, attrName, attrValue, oldAttrValue, isSvgAttribute) {
  const { node, tagAttrs, attrIndex } = part;

  // if the node is an svg element set the isSvgAttribute to true
  isSvgAttribute = isSvgAttribute || node.tagName === 'svg';

  if (
    attrValue !== oldAttrValue &&
      !isAttrOverridden(tagAttrs, attrName, attrIndex) &&
      !RESERVED_ATTRIBUTES[attrName]
  ) {
    setAttribute(node, attrName, attrValue, oldAttrValue, isSvgAttribute);
  } else if (attrName === 'ref') {
    // Note only functional refs are supported
    setRef(attrValue, node);
  }
}
