/**
 * NukeViet NVMedia for CKEditor5
 * @version 4.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2024 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import { IconCheck, IconCancel } from 'ckeditor5';
import {
    ButtonView,
    View,
    ViewCollection,
    FocusCycler,
    LabeledFieldView,
    createLabeledInputText,
    type InputTextView,
    type FocusableView
} from 'ckeditor5';
import { FocusTracker, KeystrokeHandler, type Locale } from 'ckeditor5';

export default class NVIframeYoutubeFormView extends View {
    /**
     * Nút nhập url video, audio
     */
    public urlInputView: LabeledFieldView<InputTextView>;

    /**
     * Giá trị url media đã nhập
     *
     * @observable
     */
    declare public mediaURLInputValue: string;

    /**
     *
     * @observable
     */
    declare public isMediaSelected: boolean;

    /**
     *
     * @observable
     */
    declare public isEnabled: boolean;

    /**
     * Tracks information about DOM focus in the form.
     */
    public readonly focusTracker: FocusTracker;

    /**
     * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
     */
    public readonly keystrokes: KeystrokeHandler;

    /**
     * Helps cycling over {@link #_focusables} in the form.
     */
    public readonly focusCycler: FocusCycler;

    /**
     * A collection of views that can be focused in the form.
     */
    private readonly _focusables: ViewCollection<FocusableView>;

    /**
     *
     */
    constructor(locale: Locale) {
        super(locale);

        this.set('mediaURLInputValue', '');
        this.set('isMediaSelected', false);
        this.set('isEnabled', true);

        this.focusTracker = new FocusTracker();
        this.keystrokes = new KeystrokeHandler();
        this._focusables = new ViewCollection();

        this.focusCycler = new FocusCycler({
            focusables: this._focusables,
            focusTracker: this.focusTracker,
            keystrokeHandler: this.keystrokes,
            actions: {
                // Navigate form fields backwards using the Shift + Tab keystroke.
                focusPrevious: 'shift + tab',

                // Navigate form fields forwards using the Tab key.
                focusNext: 'tab'
            }
        });

        this.urlInputView = this._createUrlInputView();

        this._focusables.addMany([
            this.urlInputView
        ]);

        this.setTemplate({
            tag: 'div',

            attributes: {
                class: [
                    'ck',
                    'ck-image-insert-url'
                ]
            },

            children: [
                this.urlInputView,
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-image-insert-url__action-row'
                        ]
                    }
                }
            ]
        });
    }

    /**
     * @inheritDoc
     */
    public override render(): void {
        super.render();

        for (const view of this._focusables) {
            this.focusTracker.add(view.element!);
        }

        // Start listening for the keystrokes coming from #element.
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
     * Tạo ô text nhập url
     */
    private _createUrlInputView() {
        const locale = this.locale!;
        const t = locale.t;
        const urlInputView = new LabeledFieldView(locale, createLabeledInputText);

        urlInputView.bind('label').to(this, 'isMediaSelected',
            value => value ? t('Update media URL') : t('Insert media via URL')
        );

        urlInputView.bind('isEnabled').to(this);

        urlInputView.fieldView.placeholder = 'https://example.com/media.mp4|mp3|ogg';

        urlInputView.fieldView.bind('value').to(this, 'mediaURLInputValue', (value: string) => value || '');
        urlInputView.fieldView.on('input', () => {
            this.mediaURLInputValue = urlInputView.fieldView.element!.value.trim();
        });

        return urlInputView;
    }

    /**
     * Tạo nút chèn
     */
    private _createInsertButton(): ButtonView {
        const locale = this.locale!;
        const t = locale.t;
        const insertButtonView = new ButtonView(locale);

        insertButtonView.set({
            icon: IconCheck,
            class: 'ck-button-save',
            type: 'submit',
            withText: true
        });

        insertButtonView.bind('label').to(this, 'isMediaSelected', value => value ? t('Update') : t('Insert'));
        insertButtonView.bind('isEnabled').to(this, 'mediaURLInputValue', this, 'isEnabled',
            (...values) => values.every(value => value)
        );

        insertButtonView.delegate('execute').to(this, 'submit');

        return insertButtonView;
    }

    /**
     * Tạo nút hủy
     */
    private _createCancelButton(): ButtonView {
        const locale = this.locale!;
        const t = locale.t;
        const cancelButtonView = new ButtonView(locale);

        cancelButtonView.set({
            label: t('Cancel'),
            icon: IconCancel,
            class: 'ck-button-cancel',
            withText: true
        });

        cancelButtonView.bind('isEnabled').to(this);

        cancelButtonView.delegate('execute').to(this, 'cancel');

        return cancelButtonView;
    }

    /**
     * Focuses the view.
     */
    public focus(direction: 1 | -1): void {
        if (direction === -1) {
            this.focusCycler.focusLast();
        } else {
            this.focusCycler.focusFirst();
        }
    }
}

/**
 * Fired when the form view is submitted.
 */
export type NVMediaInsertUrlViewSubmitEvent = {
	name: 'submit';
	args: [];
};

/**
 * Fired when the form view is canceled.
 */
export type NVMediaInsertUrlViewCancelEvent = {
	name: 'cancel';
	args: [];
};
