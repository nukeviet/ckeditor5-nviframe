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
				//const divInner = iframeUtils.findViewInnerIframeElement(element)!;
				const iframe = iframeUtils.findViewIframeElement(element)!;
				const modelElement = data.item;

				if (data.attributeKey == 'type') {
					if (data.attributeNewValue == 'fixed') {
						// Cố định thì iframe mới có width và height
						viewWriter.setAttribute('width', modelElement.getAttribute('width') || '600', iframe);
						viewWriter.setAttribute('height', modelElement.getAttribute('height') || '500', iframe);

						viewWriter.removeClass('nvck-iframe-responsive', divOuter);
						viewWriter.removeStyle('padding-bottom', divOuter);
					} else {
						viewWriter.addClass('nvck-iframe-responsive', divOuter);

						const paddingBottom = (((modelElement.getAttribute('ratio') as number[])[1] / (modelElement.getAttribute('ratio') as number[])[0]) * 100).toFixed(2);
						viewWriter.setStyle('padding-bottom', `${paddingBottom}%`, divOuter);
					}
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
 * Chuyển đổi cấu trúc thẻ div.nvck-iframe trong view thành model iframe
 */
export function upcastIframeDivStructure(iframeUtils: IframeUtils): (dispatcher: UpcastDispatcher) => void {
	const converter: GetCallback<UpcastElementEvent> = (evt, data, conversionApi) => {
		const viewDiv = data.viewItem;
		const viewInner = iframeUtils.findViewInnerIframeElement(viewDiv);
		const viewIframe = iframeUtils.findViewIframeElement(viewDiv);

		// Kiểm tra và consume div.nvck-iframe
		if (!viewDiv.hasClass('nvck-iframe') || !conversionApi.consumable.consume(viewDiv, { name: true, classes: 'nvck-iframe' })) {
			return;
		}

		const { writer: modelWriter } = conversionApi;

		// Tạo model iframe
		const modelBox = modelWriter.createElement('iframe');
		conversionApi.writer.insert(modelBox, data.modelCursor);

		if (viewInner && conversionApi.consumable.test(viewInner, { name: true })) {
			// Consume để ngăn converter khác
			conversionApi.consumable.consume(viewInner, { name: true });

			if (viewIframe && conversionApi.consumable.test(viewIframe, { name: true })) {
				// Consume iframe
				conversionApi.consumable.consume(viewIframe, { name: true });
			}
		}

		// Lấy các attribute của wrapper div
		let width = parseInt(viewDiv.getAttribute('data-iframe-width') || '');
		let height = parseInt(viewDiv.getAttribute('data-iframe-height') || '');
		let type = viewDiv.getAttribute('data-iframe-type') || '';
		let ratio = viewDiv.getAttribute('data-iframe-ratio') || '';
		let url = viewIframe ? (viewIframe.getAttribute('src') || '') : '';

		if (isNaN(width) || width <= 0 || width > 9999) {
			width = 600;
		}
		if (isNaN(height) || height <= 0 || height > 9999) {
			height = 500;
		}
		if (type != 'fixed' && type != 'auto') {
			type = 'auto';
		}
		let ratioArr: [number, number];
		const match = ratio.match(/^(\d+):(\d+)$/);
		if (match) {
			const x = parseInt(match[1], 10);
			const y = parseInt(match[2], 10);

			// Kiểm tra > 0
			if (x > 0 && y > 0) {
				ratioArr = [x, y];
			} else {
				ratioArr = [16, 9];
			}
		} else {
			ratioArr = [16, 9];
		}

		modelWriter.setAttribute('src', url, modelBox);
		modelWriter.setAttribute('type', type, modelBox);
		modelWriter.setAttribute('width', width, modelBox);
		modelWriter.setAttribute('height', height, modelBox);
		modelWriter.setAttribute('ratio', ratioArr, modelBox);

		data.modelRange = modelWriter.createRangeOn(modelBox);
		data.modelCursor = data.modelRange.end;

		conversionApi.convertChildren(data.viewItem, modelBox);
		conversionApi.updateConversionResult(modelBox, data);
	};

	return dispatcher => {
		dispatcher.on<UpcastElementEvent>('element:div', converter);
	};
}
