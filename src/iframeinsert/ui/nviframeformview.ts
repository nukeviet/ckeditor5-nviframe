/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import {
	addListToDropdown,
	Collection,
	ListDropdownItemDefinition,
	type ButtonView,
	type DropdownView,
	type InputTextView,
	type InputNumberView,
	LabeledFieldView,
	UIModel,
	FormRowView,
	View,
	createLabeledInputNumber,
	createLabeledInputText,
	createLabeledDropdown,
	submitHandler
} from 'ckeditor5';
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
	 * Chiều cao iframe
	 */
	declare public iframeHeightInputValue: number;

	/**
	 * Chiều rộng iframe
	 */
	declare public iframeWidthInputValue: number;

	/**
	 * Tỷ lệ khung hình iframe
	 */
	declare public iframeRatioInputValue: string;

	/**
	 * Kiểu chiều rộng iframe: tự động hay cố định
	 */
	declare public iframeTypeWidthValue: 'auto' | 'fixed';

	/**
	 * The URL input view.
	 */
	public urlInputView: LabeledFieldView<InputTextView>;

	public widthInputView: LabeledFieldView<InputNumberView>;

	public heightInputView: LabeledFieldView<InputNumberView>;

	public ratioInputView: LabeledFieldView<InputTextView>;

	public typeWidthSelectView: LabeledFieldView<DropdownView>;

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
		this.set('iframeHeightInputValue', 500);
		this.set('iframeWidthInputValue', 600);
		this.set('iframeRatioInputValue', '16:9');
		this.set('iframeTypeWidthValue', 'auto');
		this.urlInputView = this._createUrlInput();
		this.widthInputView = this._createWidthInput();
		this.heightInputView = this._createHeightInput();
		this.ratioInputView = this._createRatioInput();
		this.typeWidthSelectView = this._createTypeWidthSelect();

		this._validators = validators;

		// Dòng nhập URL
		const rowInput = new FormRowView(locale);
		rowInput.children.add(this.urlInputView);
		rowInput.class.push('ck-iframe-form__row_single');

		// Dòng chọn kích thước, nhập chiều rộng, chiều cao, tỷ lệ
		const rowType = new FormRowView(locale);
		rowType.children.add(this.typeWidthSelectView);
		rowType.children.add(this.widthInputView);
		rowType.children.add(this.heightInputView);
		rowType.children.add(this.ratioInputView);
		rowType.class.push('ck-iframe-form__row_column');

		this.setTemplate({
			tag: 'form',

			attributes: {
				class: [
					'ck',
					'ck-iframe-form',
					'ck-responsive-form'
				],

				tabindex: '-1'
			},

			children: [
				rowInput,
				rowType
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

	/**
	 * Tạo ô chọn kiểu kích thước: tự động hay cố định
	 *
	 * @returns LabeledFieldView<DropdownView>
	 */
	private _createTypeWidthSelect(): LabeledFieldView<DropdownView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, (labeledFieldView, viewUid, statusUid) => {
			const dropdown = createLabeledDropdown(labeledFieldView, viewUid, statusUid);
			const button = dropdown.buttonView;

			/**
			 * Xử lý lỗi của createLabeledDropdown, khi for=viewUid nó đưa vào 1 thẻ div.
			 * Render trước để lấy element là cái nút sau đó đặt id nút đó là viewUid (for của cái label)
			 * Đổi lại id của dropdown thành viewUid_outer để tránh trùng id
			 */
			dropdown.set({
				id: `${viewUid}_outer`
			});
			dropdown.render();
			button.element!.setAttribute('id', viewUid);

			return dropdown;
		});
		const dropdown = labeledInput.fieldView;

		// Thêm các lựa chọn cho dropdown
		const items = new Collection<ListDropdownItemDefinition>();
		items.add({
			type: 'button',
			model: new UIModel({
				withText: true,
				label: t('Auto'),
			})
		});
		items.add({
			type: 'button',
			model: new UIModel({
				withText: true,
				label: t('Fixed'),
			})
		});
		dropdown.on('execute', (evt) => {
			const buttonView = evt.source as ButtonView;
			dropdown.buttonView.set({ label: buttonView.label });

			if (buttonView.label === t('Auto')) {
				this.set('iframeTypeWidthValue', 'auto');
				this.widthInputView.element!.classList.add('ck-hidden');
				this.heightInputView.element!.classList.add('ck-hidden');
				this.ratioInputView.element!.classList.remove('ck-hidden');
			} else {
				this.set('iframeTypeWidthValue', 'fixed');
				this.widthInputView.element!.classList.remove('ck-hidden');
				this.heightInputView.element!.classList.remove('ck-hidden');
				this.ratioInputView.element!.classList.add('ck-hidden');
			}
		});
		addListToDropdown(dropdown, items);

		// Text cho nút dropdown
		dropdown.buttonView.set({
			label: t('Auto'),
			withText: true,
		});

		labeledInput.label = t('Size');
		labeledInput.isEmpty = false;
		labeledInput.render();
		labeledInput.element!.classList.add('c4');

		return labeledInput;
	}

	/**
	 * Tạo ô nhập chiều rộng
	 *
	 * @returns LabeledFieldView<InputNumberView>
	 */
	private _createWidthInput(): LabeledFieldView<InputNumberView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputNumber);
		const inputField = labeledInput.fieldView;

		labeledInput.label = t('Width');
		labeledInput.infoText = t('In pixels');
		labeledInput.extendTemplate({
			attributes: {
				class: ['c4']
    		}
		});

		labeledInput.render();
		labeledInput.element!.classList.add('ck-hidden');

		inputField.min = 0;
		inputField.max = 9999;

		return labeledInput;
	}

	/**
	 * Tạo ô nhập chiều cao
	 *
	 * @returns LabeledFieldView<InputNumberView>
	 */
	private _createHeightInput(): LabeledFieldView<InputNumberView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputNumber);
		const inputField = labeledInput.fieldView;

		labeledInput.label = t('Height');
		labeledInput.infoText = t('In pixels');
		labeledInput.extendTemplate({
			attributes: {
				class: ['c4']
    		}
		});

		labeledInput.render();
		labeledInput.element!.classList.add('ck-hidden');

		inputField.min = 0;
		inputField.max = 9999;

		return labeledInput;
	}

	/**
	 * Tạo ô nhập tỷ lệ
	 *
	 * @returns LabeledFieldView<InputTextView>
	 */
	private _createRatioInput(): LabeledFieldView<InputTextView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);
		//const inputField = labeledInput.fieldView;

		labeledInput.label = t('Ratio');
		labeledInput.infoText = t('Use the format x:y');
		labeledInput.extendTemplate({
			attributes: {
				class: ['c8']
    		}
		});

		return labeledInput;
	}
}
