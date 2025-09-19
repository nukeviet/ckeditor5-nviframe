/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import type {
	Editor,
	MatcherPattern,
	ViewContainerElement,
	ViewDowncastWriter,
	ViewElement
} from 'ckeditor5';
import { first } from 'ckeditor5';
import IframeUtils from '../iframeutils.js';

/**
 * Tạo phần tử view cho model iframe
 *
 * @param writer ViewDowncastWriter
 * @returns
 */
export function createIframeViewElement(writer: ViewDowncastWriter): ViewContainerElement {
	return writer.createContainerElement('div', { class: 'nvck-iframe' }, [
		writer.createContainerElement('div', { class: 'nvck-iframe-inner' }, [
			writer.createEmptyElement('iframe', { class: 'nvck-iframe-element' })
		])
	]);
}
