/**
 * @license Copyright (c) 2020-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { parseArgs } from 'node:util';
import { join, relative } from 'node:path';
import { findMessages, synchronizeTranslations } from '@ckeditor/ckeditor5-dev-translations';

const args = parseArgs( {
	options: {
		'validate-only': { type: 'boolean', default: false }
	}
} );

const cwd = process.cwd();
const translationsDir = join( cwd, 'lang', 'translations' );

// Glob handles posix paths.
const sourceFiles = globSync( join( cwd, 'src', '**', '*.[jt]s' ) );

// Từ CKEditor 5 v48, gói `@ckeditor/ckeditor5-core` trên npm không còn kèm `lang/contexts.json`,
// nên các chuỗi dùng chung như "Cancel", "Save" bị báo "Missing context".
// Thay vào đó tạo một thư mục "core" tạm, chứa context của những chuỗi mà plugin dùng nhưng đã được
// CKEditor 5 dịch sẵn (có trong `ckeditor5/translations/en.js` của phiên bản đang cài).
// Thư mục tạm cũng hứng các file dịch mà công cụ sinh ra cho core, và bị xóa sau khi chạy xong.
const corePackagePath = await createSharedContextsPackage();

// Chỉ giữ các ngôn ngữ dự án đang có. Công cụ sẽ tự sinh file cho mọi ngôn ngữ CKEditor hỗ trợ (~70);
// muốn thêm ngôn ngữ mới thì tạo sẵn file `lang/translations/<lang>.ts` trước khi chạy.
const existingTranslationFiles = new Set( readdirSync( translationsDir ) );

try {
	await synchronizeTranslations( {
		// An array containing absolute paths the package sources.
		sourceFiles,

		// An absolute path to the package.
		packagePaths: [ cwd ],

		// A relative path to the package where common translations are located.
		corePackagePath: relative( cwd, corePackagePath ),

		// Ignore unused from the core package, as the shared context may but does not have to be used.
		ignoreUnusedCorePackageContexts: true,

		// Whether to validate the translations contexts against the source messages only. No files will be updated.
		validateOnly: args.values[ 'validate-only' ],

		// Skip the license header.
		skipLicenseHeader: true,

		// Import the Translations type from the package that generated projects already depend on.
		translationsTypeImportSource: 'ckeditor5'
	} );

	for ( const file of readdirSync( translationsDir ) ) {
		if ( !existingTranslationFiles.has( file ) ) {
			rmSync( join( translationsDir, file ) );
		}
	}
} finally {
	rmSync( corePackagePath, { recursive: true, force: true } );
}

/**
 * Tạo thư mục tạm có `lang/contexts.json` chứa các chuỗi plugin dùng (không có trong context của plugin)
 * mà CKEditor 5 đã dịch sẵn. Trả về đường dẫn tuyệt đối của thư mục đó.
 */
async function createSharedContextsPackage() {
	const { default: ckeditorTranslations } = await import( 'ckeditor5/translations/en.js' );
	const sharedMessageIds = new Set( Object.keys( ckeditorTranslations.en.dictionary ) );
	const ownContexts = JSON.parse( readFileSync( join( cwd, 'lang', 'contexts.json' ), 'utf-8' ) );
	const sharedContexts = {};

	for ( const filePath of sourceFiles ) {
		findMessages( readFileSync( filePath, 'utf-8' ), filePath, message => {
			if ( !Object.hasOwn( ownContexts, message.id ) && sharedMessageIds.has( message.id ) ) {
				sharedContexts[ message.id ] = 'Shared message translated by CKEditor 5.';
			}
		}, () => {} );
	}

	const packagePath = mkdtempSync( join( tmpdir(), 'ckeditor5-shared-contexts-' ) );

	mkdirSync( join( packagePath, 'lang', 'translations' ), { recursive: true } );
	writeFileSync( join( packagePath, 'lang', 'contexts.json' ), JSON.stringify( sharedContexts, null, '\t' ) );

	return packagePath;
}
