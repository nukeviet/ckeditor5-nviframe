/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import { Command, logWarning } from 'ckeditor5';
import type IframeUtils from '../iframeutils.js';
import { type IframeExecuteCommandOptions, getDefaultIframeExecuteCommandOptions } from './iframeexecuteoptions.js';

export default class InsertIframeCommand extends Command {
	declare public value: string | undefined;

	/**
     * @inheritDoc
     */
	public override refresh(): void {
		const iframeUtils: IframeUtils = this.editor.plugins.get( 'IframeUtils' );
		this.isEnabled = iframeUtils.isIframeAllowed();
	}

	/**
	 * Thực thi lệnh chèn iframe.
	 */
	public override execute( options: string | IframeExecuteCommandOptions ): void {
		if ( typeof options === 'string' ) {
			const opts = getDefaultIframeExecuteCommandOptions();
			opts.src = options;
			options = opts;
		} else {
			options = { ...getDefaultIframeExecuteCommandOptions(), ...options };
		}
		const iframeUtils: IframeUtils = this.editor.plugins.get( 'IframeUtils' );
		if ( !iframeUtils.isUrl( options.src ) ) {
			logWarning( 'Iframe.url is not a valid URL', options );
			return;
		}

		const selection = this.editor.model.document.selection;
		const selectionAttributes = Object.fromEntries( selection.getAttributes() );
		const config = this.editor.config.get( 'iframe.attributes' )!;
		iframeUtils.insertIframe( { ...config, ...options, ...selectionAttributes } );
	}
}
