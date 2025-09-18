/**
 * NukeViet NVIframe for CKEditor5
 * @version 4.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2024 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import type {
	DowncastDispatcher,
	ModelElement,
	UpcastDispatcher,
	UpcastElementEvent,
	DowncastAttributeEvent
} from 'ckeditor5';
import { first, type GetCallback } from 'ckeditor5';
import type IframeUtils from '../iframeutils.js';

/**
 * Chuyển đổi thuộc tính iframe từ model sang view editing và data
 *
 * @param iframeUtils
 * @param attributeKeys
 * @returns
 */
export function downcastIframeAttribute(iframeUtils: IframeUtils, attributeKeys: string[]): (dispatcher: DowncastDispatcher) => void {
	return dispatcher => {
		for (const attributeKey of attributeKeys) {
			dispatcher.on<DowncastAttributeEvent<ModelElement>>(`attribute:${attributeKey}:iframe`, (evt, data, conversionApi) => {
				if (!conversionApi.consumable.consume(data.item, evt.name)) {
					return;
				}

				const viewWriter = conversionApi.writer;
				const element = conversionApi.mapper.toViewElement(data.item)!;
				if (!element) {
					return;
				}

				const divOuter = iframeUtils.findViewOuterIframeElement(element)!;
				const divInner = iframeUtils.findViewInnerIframeElement(element)!;
				const iframe = iframeUtils.findViewIframeElement(element)!;
				const modelElement = data.item;

				if (data.attributeKey == 'type' && data.attributeNewValue == 'fixed') {
					// Cố định thì iframe mới có width và height
					viewWriter.setAttribute('width', modelElement.getAttribute('width') || '600', iframe);
					viewWriter.setAttribute('height', modelElement.getAttribute('height') || '500', iframe);
				}

				if (
					data.attributeKey == 'ratio' || data.attributeKey == 'width' ||
					data.attributeKey == 'height' || data.attributeKey == 'type'
				) {
					viewWriter.setAttribute(`data-iframe-${data.attributeKey}`, data.attributeKey == 'ratio' ? (data.attributeNewValue as number[]).join(':') : data.attributeNewValue, divOuter);
					return;
				}

				viewWriter.setAttribute(data.attributeKey, data.attributeNewValue || '', iframe);
			});
		}
	};
}

/**
 *
 */
export function upcastIframeDiv(iframeUtils: IframeUtils): (dispatcher: UpcastDispatcher) => void {
	const converter: GetCallback<UpcastElementEvent> = (evt, data, conversionApi) => {
		// Không chuyển đổi nếu thẻ không phải là div.nv-iframe
		if (!conversionApi.consumable.test(data.viewItem, { name: true, classes: 'nv-iframe' })) {
			return;
		}

		// Tìm thẻ iframe trong div
		const viewIframe = iframeUtils.findViewIframeElement(data.viewItem);

		// Không chuyển đổi nếu không tìm thấy thẻ iframe hoặc nó đã chuyển đổi
		if (!viewIframe || !conversionApi.consumable.test(viewIframe, { name: true })) {
			return;
		}

		// Consume the div to prevent other converters from processing it again.
		conversionApi.consumable.consume(data.viewItem, { name: true, classes: 'nv-iframe' });

		// Convert view iframe to model.
		const conversionResult = conversionApi.convertItem(viewIframe, data.modelCursor);

		// Lấy model được chuyển đổi
		const modelIframe = first(conversionResult.modelRange!.getItems()) as ModelElement;

		// Chuyển không thành công thì dừng
		if (!modelIframe) {
			conversionApi.consumable.revert(data.viewItem, { name: true, classes: 'nv-iframe' });
			return;
		}

		conversionApi.convertChildren(data.viewItem, modelIframe);
		conversionApi.updateConversionResult(modelIframe, data);
	};

	return dispatcher => {
		dispatcher.on<UpcastElementEvent>('element:div', converter);
	};
}
