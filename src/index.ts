/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

/**
 * @module nviframe
 */

export { default as NVIframe } from './nviframe.js';
export { default as NVIframeInsert } from './nviframeinsert.js';
export { default as NVIframeInsertUI } from './iframeinsert/nviframeinsertui.js';
export { default as IframeEditing } from './iframe/iframeediting.js';
export { default as IframeUtils } from './iframeutils.js';
export type { default as InsertIframeCommand } from './iframe/insertiframecommand.js';
export type { default as ReplaceIframeSourceCommand } from './iframe/replaceiframesourcecommand.js';

import './augmentation.js';
