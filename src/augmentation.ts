/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import type {
	NVIframe,
	NVIframeInsert,
	NVIframeInsertUI,
	InsertIframeCommand,
	ReplaceIframeSourceCommand,
	IframeEditing,
	IframeUtils
} from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	// interface EditorConfig {
	// 	/**
	// 	 *
	// 	 */
	// 	nvbox?: NVBoxConfig;
	// }

	// Khai báo các plugin
	interface PluginsMap {
		[NVIframe.pluginName]: NVIframe;
		[NVIframeInsert.pluginName]: NVIframeInsert;
		[NVIframeInsertUI.pluginName]: NVIframeInsertUI;
		[IframeEditing.pluginName]: IframeEditing;
		[IframeUtils.pluginName]: IframeUtils;
	}

	// Khai báo các command
	interface CommandsMap {
		insertIframe: InsertIframeCommand;
		replaceIframeSource: ReplaceIframeSourceCommand;
	}
}
