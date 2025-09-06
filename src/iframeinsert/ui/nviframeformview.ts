/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import {
	type InputTextView,
	LabeledFieldView,
	View,
	createLabeledInputText,
	submitHandler
} from 'ckeditor5/src/ui.js';
import { FocusTracker, KeystrokeHandler, type Locale } from 'ckeditor5/src/utils.js';

import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
import '../../../theme/nviframeform.css';

/**
 * The media form view controller class.
 */
export class NVIframeFormView extends View {
	/**
	 * Tracks information about the DOM focus in the form.
	 */
	public readonly focusTracker: FocusTracker;

	/**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */
	public readonly keystrokes: KeystrokeHandler;

	/**
	 * The value of the URL input.
	 */
	declare public iframeURLInputValue: string;

	/**
	 * The URL input view.
	 */
	public urlInputView: LabeledFieldView<InputTextView>;

	/**
	 * Mảng các hàm kiểm tra tính hợp lệ của form
	 */
	private readonly _validators: Array<(v: NVIframeFormView) => string | undefined>;

	/**
	 * Nhãn của ô nhập URL iframe mặc định
	 */
	private _urlInputViewInfoDefault?: string;

	/**
	 * Text mẹo cho ô nhập URL iframe.
	 */
	private _urlInputViewInfoTip?: string;

	/**
	 * @param validators Array of form validators.
	 * @param locale
	 */
	constructor(validators: Array<(v: NVIframeFormView) => string | undefined>, locale: Locale) {
		super(locale);

		this.focusTracker = new FocusTracker();
		this.keystrokes = new KeystrokeHandler();
		this.set('iframeURLInputValue', '');
		this.urlInputView = this._createUrlInput();

		this._validators = validators;

		this.setTemplate({
			tag: 'form',

			attributes: {
				class: [
					'ck',
					'ck-media-form',
					'ck-responsive-form'
				],

				tabindex: '-1'
			},

			children: [
				this.urlInputView
			]
		});
	}

	/**
	 * @inheritDoc
	 */
	public override render(): void {
		super.render();

		submitHandler({
			view: this
		});

		this.focusTracker.add(this.urlInputView.element!);
		this.keystrokes.listenTo(this.element!);
	}

	/**
	 * @inheritDoc
	 */
	public override destroy(): void {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}

	/**
	 * Focuses the URL input.
	 */
	public focus(): void {
		this.urlInputView.focus();
	}

	/**
	 * Get the URL in the URL input.
	 */
	public get url(): string {
		return this.urlInputView.fieldView.element!.value.trim();
	}

	/**
	 * @param url The URL to set.
	 */
	public set url(url: string) {
		this.urlInputView.fieldView.value = url.trim();
	}

	/**
	 * Kiểm tra tính hợp lệ của form.
	 *
	 * @returns true|false
	 */
	public isValid(): boolean {
		this.resetFormStatus();

		for (const validator of this._validators) {
			const errorText = validator(this);
			if (errorText) {
				this.urlInputView.errorText = errorText;
				return false;
			}
		}

		return true;
	}

	/**
	 * Xóa dữ liệu, cảnh báo, tip và đưa về mặc định
	 *
	 * See {@link #isValid}.
	 */
	public resetFormStatus(): void {
		this.urlInputView.errorText = null;
		this.urlInputView.infoText = this._urlInputViewInfoDefault!;
	}

	/**
	 * Tạo ô nhập URL iframe.
	 *
	 * @returns LabeledFieldView<InputTextView>
	 */
	private _createUrlInput(): LabeledFieldView<InputTextView> {
		const t = this.locale!.t;

		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);
		const inputField = labeledInput.fieldView;

		this._urlInputViewInfoDefault = t('Paste the iframe URL in the input.');
		this._urlInputViewInfoTip = t('Tip: Paste the URL into the content to embed faster.');

		labeledInput.label = t('Iframe URL');
		labeledInput.infoText = this._urlInputViewInfoDefault;

		inputField.inputMode = 'url';
		inputField.on('input', () => {
			// Hiển thị mẹo khi có nhập liệu, không có dữ liệu thì hiển thị nhãn mặc định
			labeledInput.infoText = inputField.element!.value ? this._urlInputViewInfoTip! : this._urlInputViewInfoDefault!;
			this.iframeURLInputValue = inputField.element!.value.trim();
		});

		return labeledInput;
	}
}
