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
	return writer.createContainerElement('div', { class: 'nv-iframe' }, [
		writer.createContainerElement('div', { class: 'nv-iframe-inner' }, [
			writer.createEmptyElement('iframe', { class: 'nv-iframe-element' })
		])
	]);
}

/**
 * Từ view chính tìm các phần tử con là iframe trong nó
 *
 * @param editor Editor
 * @returns
 */
export function getIframeViewElementMatcher(editor: Editor): MatcherPattern {
	const iframeUtils: IframeUtils = editor.plugins.get('IframeUtils');

	return element => {
		// Không phải thẻ iframe thì loại
		if (!iframeUtils.isIframeView(element)) {
			return null;
		}

		// Cha trực tiếp phải là div.nv-iframe-inner
		const parent = element.parent;
		if (
			!parent ||
			!parent.is('element', 'div') ||
			!parent.hasClass('nv-iframe-inner')
		) {
			return null;
		}

		// Cha của cha nó phải là div.nv-iframe
		const grandParent = parent.parent;
		if (
			!grandParent ||
			!grandParent.is('element', 'div') ||
			!grandParent.hasClass('nv-iframe')
		) {
			return null;
		}

		return getPositiveMatchPattern(element);
	};

	function getPositiveMatchPattern(element: ViewElement) {
		const pattern: Record<string, unknown> = {
			name: true
		};

		if (element.hasAttribute('src')) {
			pattern.attributes = ['src'];
		}

		return pattern;
	}
}
