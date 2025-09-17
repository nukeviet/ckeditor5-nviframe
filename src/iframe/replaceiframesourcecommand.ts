/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import { Command, type Editor } from 'ckeditor5';
import type IframeUtils from '../iframeutils.js';
import type { ModelWriter, ModelElement } from 'ckeditor5';

/**
 * Lệnh thay src của iframe thành src khác.
 *
 * ```ts
 * editor.execute( 'replaceIframeSource', { source: 'http://url.iframe.to.the/replace' } );
 * ```
 */
export default class ReplaceIframeSourceCommand extends Command {
    declare public value: string | null;

    constructor(editor: Editor) {
        super(editor);

        this.decorate('cleanupIframe');
    }

    /**
     * @inheritDoc
     */
    public override refresh(): void {
        const editor = this.editor;
        const iframeUtils: IframeUtils = editor.plugins.get('IframeUtils');
        const element = this.editor.model.document.selection.getSelectedElement()!;

        this.isEnabled = iframeUtils.isIframe(element);
        this.value = this.isEnabled ? element.getAttribute('src') as string : null;
    }

    /**
     * Executes the command.
     *
     * @fires execute
     * @param options Options for the executed command.
     * @param options.source The url source to replace.
     */
    public override execute(options: { source: string }): void {
        const iframe = this.editor.model.document.selection.getSelectedElement()!;

        this.editor.model.change(writer => {
            writer.setAttribute('src', options.source, iframe);
            this.cleanupIframe(writer, iframe);
        });
    }

    public cleanupIframe(writer: ModelWriter, iframe: ModelElement): void {
        //writer.removeAttribute('srcset', iframe);
        //writer.removeAttribute('sizes', iframe);
        //writer.removeAttribute('sources', iframe);
        //writer.removeAttribute('width', iframe);
        //writer.removeAttribute('height', iframe);
        //writer.removeAttribute('alt', iframe);
        // Not thing, future features
    }
}
