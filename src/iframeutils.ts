/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2026 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import {
	type ModelElement,
	type ViewElement,
	type ModelDocumentSelection,
	type ModelSelection,
	type ModelDocumentFragment,
	type ViewDowncastWriter,
	type Model,
	type ModelPosition,
	type Editor,
	findOptimalInsertionRange,
	toWidget,
	Plugin
} from 'ckeditor5';

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

		if ( !attributes.src ) {
			return null;
		}

		// Gộp các thuộc tính về làm 1
		attributes = {
			...Object.fromEntries( selection.getAttributes() ),
			...attributes
		};

		// Xóa các attr nếu không được phép trong schema
		for ( const attributeName in attributes ) {
			if ( !model.schema.checkAttribute( 'iframe', attributeName ) ) {
				delete attributes[ attributeName ];
			}
		}

		attributes.src = autoProcessSrc( attributes.src as string );

		// Chèn model vào
		return model.change( writer => {
			const iframeElement = writer.createElement( 'iframe', attributes );

			model.insertObject( iframeElement, selectable, null, {
				setSelection: 'on',
				findOptimalPosition: !selectable ? 'auto' : undefined
			} );

			if ( iframeElement.parent ) {
				return iframeElement;
			}

			return null;
		} );
	}

	/**
     *
     */
	public toIframeWidget( viewElement: ViewElement, writer: ViewDowncastWriter, label: string ): ViewElement {
		writer.setCustomProperty( 'iframe', true, viewElement );

		const labelCreator = () => {
			// const imgElement = this.findViewImgElement(viewElement)!;
			// const altText = imgElement.getAttribute('alt');

			// return altText ? `${altText} ${label}` : label;
			return label;
		};

		return toWidget( viewElement, writer, { label: labelCreator } );
	}

	/**
     * Kiểm tra phần tử có phải là iframe không
     */
	public isIframe( modelElement?: ModelElement | null ): modelElement is ModelElement & { name: 'iframe' } {
		return !!modelElement && modelElement.is( 'element', 'iframe' );
	}

	/**
     * Kiểm tra xem iframe có thể chèn vào vị trí hiện tại hay không
     *
     * @internal
     */
	public isIframeAllowed(): boolean {
		const model = this.editor.model;
		const selection = model.document.selection;

		return isIframeAllowedInParent( this.editor, selection ) && isNotInsideIframe( selection );
	}

	/**
     * Tìm thẻ iframe trong cấu trúc html iframe
     */
	public findViewIframeElement( divView: ViewElement ): ViewElement | undefined {
		if ( this.isIframeView( divView ) ) {
			return divView;
		}

		const editingView = this.editor.editing.view;

		for ( const { item } of editingView.createRangeIn( divView ) ) {
			if ( this.isIframeView( item as ViewElement ) ) {
				return item as ViewElement;
			}
		}
	}

	public findViewOuterIframeElement( divView: ViewElement ): ViewElement | undefined {
		if ( divView.is( 'element', 'div' ) && divView.hasClass( 'nvck-iframe' ) ) {
			return divView;
		}
	}

	public findViewInnerIframeElement( divView: ViewElement ): ViewElement | undefined {
		const editingView = this.editor.editing.view;

		for ( const { item } of editingView.createRangeIn( divView ) ) {
			if ( !!item && item.is( 'element', 'div' ) && item.hasClass( 'nvck-iframe-inner' ) ) {
				return item as ViewElement;
			}
		}
	}

	/**
     * Xác định đối tượng ViewElement có phải là iframe không
     */
	public isIframeView( element?: ViewElement | null ): boolean {
		return !!element && element.is( 'element', 'iframe' );
	}

	public isBlockIframeView( element?: ViewElement | null ): boolean {
		return !!element && element.is( 'element', 'div' ) && element.hasClass( 'nvck-iframe' );
	}

	/**
     * Kiểm tra URL hợp lệ hay không
     *
     * @param url URL cần kiểm tra
     * @returns
     */
	public isUrl( url: string ): boolean {
		if ( url.startsWith( '/' ) ) {
			// Url nội bộ
			return true;
		}
		const urlPattern = /^(https?:\/\/[^\s]+)/;
		return urlPattern.test( url );
	}

	/**
     * Kiểm tra xem phần tử view có nằm trong iframe hay không
     * @param viewElement Phần tử view cần kiểm tra
     * @returns
     */
	public isViewInsideIframe( viewElement: ViewElement ): boolean {
		// Cha cấp 1 (phải là div.nvck-iframe-inner)
		const parent1 = viewElement.parent as ViewElement | null;
		if ( !parent1 || !parent1.is( 'element', 'div' ) || !parent1.hasClass( 'nvck-iframe-inner' ) ) {
			return false;
		}

		// Cha cấp 2 (phải là div.nvck-iframe)
		const parent2 = parent1.parent as ViewElement | null;
		if ( !parent2 || !parent2.is( 'element', 'div' ) || !parent2.hasClass( 'nvck-iframe' ) ) {
			return false;
		}

		return true;
	}
}

/**
 * Kiểm tra xem iframe có chèn được trong đối tượng cha đang chọn hay không
 */
function isIframeAllowedInParent( editor: Editor, selection: ModelSelection | ModelDocumentSelection ): boolean {
	const parent = getInsertIframeParent( selection, editor.model );

	if ( editor.model.schema.checkChild( parent as ModelElement, 'iframe' ) ) {
		return true;
	}

	return false;
}

/**
 * Checks if selection is not placed inside an iframe (e.g. its caption).
 */
function isNotInsideIframe( selection: ModelDocumentSelection ): boolean {
	return [ ...selection.focus!.getAncestors() ].every( ancestor => !ancestor.is( 'element', 'iframe' ) );
}

/**
 * Returns a node that will be used to insert image with `model.insertContent`.
 */
function getInsertIframeParent( selection: ModelSelection | ModelDocumentSelection, model: Model ): ModelElement | ModelDocumentFragment {
	const insertionRange = findOptimalInsertionRange( selection, model );
	const parent = insertionRange.start.parent;

	if ( parent.isEmpty && !parent.is( 'element', '$root' ) ) {
		return parent.parent!;
	}

	return parent;
}

/**
 * Chuẩn hóa URL video về dạng EMBED
 * (Nếu đã là embed thì giữ nguyên)
 */
function autoProcessSrc( url: string ): string {
	const providers: Array<{
		name: string;
		patterns: Array<RegExp>;
		toEmbed: ( id: string, match: RegExpExecArray ) => string;
	}> = [
		// 🟥 YouTube
		{
			name: 'youtube',
			patterns: [
				// https://www.youtube.com/watch?v=ID
				/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i,
				// https://youtu.be/ID
				/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
				// https://www.youtube.com/shorts/ID
				/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
				// https://www.youtube.com/embed/ID (đã embed)
				/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i
			],
			toEmbed: ( id, match ) => {
				// Nếu match từ /embed/ thì giữ nguyên (coi như đã embed)
				if ( /embed/.test( match[ 0 ] ) ) {
					return url;
				}
				return `https://www.youtube.com/embed/${ id }`;
			}
		},

		// 🟦 Vimeo
		{
			name: 'vimeo',
			patterns: [
				// https://vimeo.com/123456789
				/(?:vimeo\.com\/)(\d+)/i,
				// https://player.vimeo.com/video/123456789
				/(?:player\.vimeo\.com\/video\/)(\d+)/i
			],
			toEmbed: ( id, match ) => {
				if ( /player\.vimeo/.test( match[ 0 ] ) ) {
					return url;
				}
				return `https://player.vimeo.com/video/${ id }`;
			}
		},

		// 🟩 Facebook (public video)
		{
			name: 'facebook',
			patterns: [
				// https://www.facebook.com/.../videos/123456789/
				/facebook\.com\/(?:.+)\/videos\/(\d+)/i,
				// https://fb.watch/abcXYZ/
				/fb\.watch\/([a-zA-Z0-9_-]+)/i
			],
			toEmbed: ( id, match ) => {
				// Facebook embed yêu cầu full URL encode
				// Với dạng videos/ID:
				if ( /videos/.test( match[ 0 ] ) ) {
					return `https://www.facebook.com/plugins/video.php?href=${ encodeURIComponent( url ) }`;
				}
				// Với dạng fb.watch/ -> vẫn cần full URL
				return `https://www.facebook.com/plugins/video.php?href=${ encodeURIComponent( url ) }`;
			}
		},

		// 🟧 TikTok
		{
			name: 'tiktok',
			patterns: [
				// https://www.tiktok.com/@username/video/1234567890123456789
				/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
				// https://www.tiktok.com/embed/1234567890123456789
				/tiktok\.com\/embed\/(\d+)/i
			],
			toEmbed: ( id, match ) =>
				/embed/.test( match[ 0 ] ) ?
					url :
					`https://www.tiktok.com/embed/${ id }`
		},

		// 🟪 Dailymotion
		{
			name: 'dailymotion',
			patterns: [
				// https://www.dailymotion.com/video/x7xyzab
				/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i,
				// https://www.dailymotion.com/embed/video/x7xyzab
				/dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/i
			],
			toEmbed: ( id, match ) =>
				/embed/.test( match[ 0 ] ) ?
					url :
					`https://www.dailymotion.com/embed/video/${ id }`
		}
	];

	for ( const p of providers ) {
		for ( const pattern of p.patterns ) {
			const m = pattern.exec( url );
			if ( m && m[ 1 ] ) {
				return p.toEmbed( m[ 1 ], m );
			}
		}
	}

	// Không khớp nhà cung cấp nào: trả nguyên URL
	return url;
}
