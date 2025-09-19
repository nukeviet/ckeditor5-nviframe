/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import type {
    ModelElement,
    ViewElement,
    ModelDocumentSelection,
    ModelSelection,
    ModelDocumentFragment,
    ViewDowncastWriter,
    Model,
    ModelPosition,
} from 'ckeditor5';
import { Plugin, type Editor } from 'ckeditor5';
import { findOptimalInsertionRange, toWidget } from 'ckeditor5';

export default class IframeUtils extends Plugin {
    /**
     * @inheritDoc
     */
    public static get pluginName() {
        return 'IframeUtils' as const;
    }

    /**
     *
     */
    public insertIframe(
        attributes: Record<string, unknown> = {},
        selectable: ModelSelection | ModelPosition | null = null
    ): ModelElement | null {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;

        if (!attributes.src) {
            return null;
        }

        // Gộp các thuộc tính về làm 1
        attributes = {
            ...Object.fromEntries(selection.getAttributes()),
            ...attributes
        };

        // Xóa các attr nếu không được phép trong schema
        for (const attributeName in attributes) {
            if (!model.schema.checkAttribute('iframe', attributeName)) {
                delete attributes[attributeName];
            }
        }

        // Chèn model vào
        return model.change(writer => {
            const iframeElement = writer.createElement('iframe', attributes);

            model.insertObject(iframeElement, selectable, null, {
                setSelection: 'on',
                findOptimalPosition: !selectable ? 'auto' : undefined
            });

            if (iframeElement.parent) {
                return iframeElement;
            }

            return null;
        });
    }

    /**
     *
     */
    public toIframeWidget(viewElement: ViewElement, writer: ViewDowncastWriter, label: string): ViewElement {
        writer.setCustomProperty('iframe', true, viewElement);

        const labelCreator = () => {
            //const imgElement = this.findViewImgElement(viewElement)!;
            //const altText = imgElement.getAttribute('alt');

            //return altText ? `${altText} ${label}` : label;
            return label;
        };

        return toWidget(viewElement, writer, { label: labelCreator });
    }

    /**
     * Kiểm tra phần tử có phải là iframe không
     */
    public isIframe(modelElement?: ModelElement | null): modelElement is ModelElement & { name: 'iframe' } {
        return !!modelElement && modelElement.is('element', 'iframe');
    }

    /**
     * Kiểm tra xem iframe có thể chèn vào vị trí hiện tại hay không
     *
     * @internal
     */
    public isIframeAllowed(): boolean {
        const model = this.editor.model;
        const selection = model.document.selection;

        return isIframeAllowedInParent(this.editor, selection) && isNotInsideIframe(selection);
    }

    /**
     * Tìm thẻ iframe trong cấu trúc html iframe
     */
    public findViewIframeElement(divView: ViewElement): ViewElement | undefined {
        if (this.isIframeView(divView)) {
            return divView;
        }

        const editingView = this.editor.editing.view;

        for (const { item } of editingView.createRangeIn(divView)) {
            if (this.isIframeView(item as ViewElement)) {
                return item as ViewElement;
            }
        }
    }

    public findViewOuterIframeElement(divView: ViewElement): ViewElement | undefined {
        if (divView.is('element', 'div') && divView.hasClass('nvck-iframe')) {
            return divView;
        }
    }

    public findViewInnerIframeElement(divView: ViewElement): ViewElement | undefined {
        const editingView = this.editor.editing.view;

        for (const { item } of editingView.createRangeIn(divView)) {
            if (!!item && item.is('element', 'div') && item.hasClass('nvck-iframe-inner')) {
                return item as ViewElement;
            }
        }
    }

    /**
     * Xác định đối tượng ViewElement có phải là iframe không
     */
    public isIframeView(element?: ViewElement | null): boolean {
        return !!element && element.is('element', 'iframe');
    }

    public isBlockIframeView(element?: ViewElement | null): boolean {
        return !!element && element.is('element', 'div') && element.hasClass('nvck-iframe');
    }

    /**
     * Kiểm tra URL hợp lệ hay không
     *
     * @param url URL cần kiểm tra
     * @returns
     */
    public isUrl(url: string): boolean {
        if (url.startsWith('/')) {
            // Url nội bộ
            return true;
        }
        const urlPattern = /^(https?:\/\/[^\s]+)/;
        return urlPattern.test(url);
    }
}

/**
 * Kiểm tra xem iframe có chèn được trong đối tượng cha đang chọn hay không
 */
function isIframeAllowedInParent(editor: Editor, selection: ModelSelection | ModelDocumentSelection): boolean {
    const parent = getInsertIframeParent(selection, editor.model);

    if (editor.model.schema.checkChild(parent as ModelElement, 'iframe')) {
        return true;
    }

    return false;
}

/**
 * Checks if selection is not placed inside an iframe (e.g. its caption).
 */
function isNotInsideIframe(selection: ModelDocumentSelection): boolean {
    return [...selection.focus!.getAncestors()].every(ancestor => !ancestor.is('element', 'iframe'));
}

/**
 * Returns a node that will be used to insert image with `model.insertContent`.
 */
function getInsertIframeParent(selection: ModelSelection | ModelDocumentSelection, model: Model): ModelElement | ModelDocumentFragment {
    const insertionRange = findOptimalInsertionRange(selection, model);
    const parent = insertionRange.start.parent;

    if (parent.isEmpty && !parent.is('element', '$root')) {
        return parent.parent!;
    }

    return parent;
}
