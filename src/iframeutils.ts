/**
 * NukeViet NVMedia for CKEditor5
 * @version 4.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2024 VINADES.,JSC. All rights reserved
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
    public insertMedia(
        attributes: Record<string, unknown> = {},
        selectable: ModelSelection | ModelPosition | null = null,
        mediaType: ('NVMediaVideo' | 'NVMediaAudio' | null) = null,
        options: { setMediaSizes?: boolean } = {}
    ): ModelElement | null {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;

        if (!attributes.src) {
            return null;
        }

        // Xác định loại media từ url, mặc định cho về video
        const determinedMediaType = determineMediaTypeFromSrc(String(attributes.src), mediaType);

        // Gộp các thuộc tính về làm 1
        attributes = {
            ...Object.fromEntries(selection.getAttributes()),
            ...attributes
        };

        // Xóa các attr nếu không được phép trong schema
        for (const attributeName in attributes) {
            if (!model.schema.checkAttribute(determinedMediaType, attributeName)) {
                delete attributes[attributeName];
            }
        }

        // Chèn model vào
        return model.change(writer => {
            const mediaElement = writer.createElement(determinedMediaType, attributes);

            model.insertObject(mediaElement, selectable, null, {
                setSelection: 'on',
                findOptimalPosition: !selectable ? 'auto' : undefined
            });

            if (mediaElement.parent) {
                return mediaElement;
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
     * Kiểm tra phần tử có phải là media (video, audio) không
     */
    public isMedia(modelElement?: ModelElement | null): modelElement is ModelElement & { name: 'NVMediaVideo' | 'NVMediaAudio' } {
        return this.isMediaVideo(modelElement) || this.isMediaAudio(modelElement);
    }

    /**
     * Kiểm tra nếu phần tử được chọn là NVMediaVideo
     */
    public isMediaVideo(modelElement?: ModelElement | null): boolean {
        return !!modelElement && modelElement.is('element', 'NVMediaVideo');
    }

    /**
     * Kiểm tra nếu phần tử được chọn là NVMediaAudio
     */
    public isMediaAudio(modelElement?: ModelElement | null): boolean {
        return !!modelElement && modelElement.is('element', 'NVMediaAudio');
    }

    /**
     * Kiểm tra xem media có thể chèn vào vị trí hiện tại hay không
     *
     * @internal
     */
    public isMediaAllowed(): boolean {
        const model = this.editor.model;
        const selection = model.document.selection;

        return isMediaAllowedInParent(this.editor, selection) && isNotInsideMedia(selection);
    }

    /**
     * Tìm thẻ iframe trong cấu trúc html iframe
     */
    public findViewIframeElement(figureView: ViewElement): ViewElement | undefined {
        if (this.isIframeView(figureView)) {
            return figureView;
        }

        const editingView = this.editor.editing.view;

        for (const { item } of editingView.createRangeIn(figureView)) {
            if (this.isIframeView(item as ViewElement)) {
                return item as ViewElement;
            }
        }
    }

    /**
     * Xác định đối tượng ViewElement có phải là media không
     */
    public isIframeView(element?: ViewElement | null): boolean {
        return !!element && element.is('element', 'iframe');
    }

    public isBlockIframeView(element?: ViewElement | null): boolean {
        return !!element && element.is('element', 'div') && element.hasClass('nv-iframe');
    }
}

/**
 * Kiểm tra xem video, audio có chèn được trong đối tượng cha đang chọn hay không
 */
function isMediaAllowedInParent(editor: Editor, selection: ModelSelection | ModelDocumentSelection): boolean {
    const parent = getInsertMediaParent(selection, editor.model);

    if (editor.model.schema.checkChild(parent as ModelElement, 'NVMediaVideo') || editor.model.schema.checkChild(parent as ModelElement, 'NVMediaAudio')) {
        return true;
    }

    return false;
}

/**
 * Checks if selection is not placed inside an image (e.g. its caption).
 */
function isNotInsideMedia(selection: ModelDocumentSelection): boolean {
    return [...selection.focus!.getAncestors()].every(ancestor => !(ancestor.is('element', 'NVMediaVideo') || ancestor.is('element', 'NVMediaAudio')));
}

/**
 * Returns a node that will be used to insert image with `model.insertContent`.
 */
function getInsertMediaParent(selection: ModelSelection | ModelDocumentSelection, model: Model): ModelElement | ModelDocumentFragment {
    const insertionRange = findOptimalInsertionRange(selection, model);
    const parent = insertionRange.start.parent;

    if (parent.isEmpty && !parent.is('element', '$root')) {
        return parent.parent!;
    }

    return parent;
}

/**
 * Xác định loại video hay audio sẽ chèn vào vị trí đó
 */
/*
function determineMediaTypeForInsertion(
    editor: Editor,
    selectable: ModelPosition, // | Selection | ModelDocumentSelection
    mediaType: 'NVMediaVideo' | 'NVMediaAudio' | null
): 'NVMediaVideo' | 'NVMediaAudio' {
    const schema = editor.model.schema;

    // Nếu chỉ định luôn thì trả về cái được chỉ định
    if (mediaType) {
        return mediaType;
    }

    // Đang chọn 1 đối tượng thì trả về tùy vào đối tượng đó
    //if (selectable.is('selection')) {
    //    return determineMediaTypeForInsertionAtSelection(schema, selectable);
    //}

    // Cuối cùng kiểm tra trong nó có audio thì chèn audio mà trong có video thì chèn video
    return schema.checkChild(selectable, 'NVMediaAudio') ? 'NVMediaAudio' : 'NVMediaVideo';
}
*/
//determineMediaTypeFromSrc

/**
 * Xác định loại video hay audio sẽ chèn vào tùy thuộc vào định dạng
 */
function determineMediaTypeFromSrc(
    src: string,
    mediaType: 'NVMediaVideo' | 'NVMediaAudio' | null
): 'NVMediaVideo' | 'NVMediaAudio' {
    if (mediaType) {
        return mediaType;
    }

    const ext = getFileExtension(src);
    if (extIsAudio(ext)) {
        return 'NVMediaAudio';
    }
    if (extIsVideo(ext)) {
        return 'NVMediaVideo';
    }

    return 'NVMediaVideo';
}

/**
 * Lấy phần mở rộng từ url
 */
function getFileExtension(fileName: string): string {
    const extensionRegExp = /\.(?<ext>[^.]+)$/;
    const match = fileName.match(extensionRegExp);

    return match!.groups!.ext.toLowerCase();
}

/**
 * Kiểm tra phần mở rộng có phải tập video hay không
 */
function extIsVideo(ext: string): boolean {
    const listVideoExts = [
        'mp4', 'mov', 'webm', 'ogg', '3gp', 'mpeg'
    ];
    return listVideoExts.includes(ext);
}

/**
 * Kiểm tra phần mở rộng có phải tập âm thanh hay không
 */
function extIsAudio(ext: string): boolean {
    const listAudioExts = [
        'mp3', 'wav', 'flac', 'aac'
    ];
    return listAudioExts.includes(ext);
}
