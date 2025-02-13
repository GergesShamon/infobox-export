import type { KeyValue, Property, Type } from './types/main';
import type { ItemId, PropertyId, Unit } from './types/wikidata/types';

/**
 * Returns an array of elements with duplicate values deleted
 */
export function unique( array: any[] ): any[] {
	const $ = require( 'jquery' );
	return $.grep( array, function ( el: any, index: number ): boolean {
		return index === $.inArray( el, array );
	} );
}

export function getRandomHex( min: number, max: number ): string {
	return ( Math.floor( Math.random() * ( max - min + 1 ) ) + min ).toString( 16 );
}

export function lowercaseFirst( value: string ): string {
	return value.slice( 0, 1 ).toLowerCase() + value.slice( 1 );
}

export function uppercaseFirst( value: string ): string {
	return value.slice( 0, 1 ).toUpperCase() + value.slice( 1 );
}

export function clone( value: any ): any {
	return JSON.parse( JSON.stringify( value ) );
}

export function get( object: object, path: string ): any {
	return path
		.split( '.' )
		.reduce(
			( obj: object | any, key: string ) => obj?.[ key ],
			object
		);
}

export function set( object: object, path: string, value: any ): void {
	const keys: string[] = path.split( '.' );
	return keys.reduce(
		function ( obj: object | any, key: string, index: number ) {
			if ( index < keys.length - 1 ) {
				if ( typeof obj[ key ] !== 'object' || obj[ key ] === null ) {
					obj[ key ] = {};
				}
			} else {
				obj[ key ] = value;
			}
			return obj[ key ];
		},
		object
	);
}

export function getLabelValue( labels: KeyValue, languages: string[], defaultValue?: string ): string {
	languages.push( 'en' );
	for ( const language of languages ) {
		if ( labels[ language ] ) {
			return labels[ language ].value;
		}
	}
	if ( Object.values( labels ).length ) {
		const label: KeyValue = Object.values( labels ).shift();
		return label.value;
	}
	if ( defaultValue ) {
		return defaultValue;
	}
	return '';
}

export function getAliases( labels: KeyValue, aliases: KeyValue, language: string ): string[] {
	const data: KeyValue[] = aliases[ language ] || [];
	if ( labels[ language ] ) {
		data.push( labels[ language ] );
	}
	return data.map( ( label: KeyValue ) => label.value.toLowerCase() );
}

export async function sleep( milliseconds: number ): Promise<void> {
	// eslint-disable-next-line
	return new Promise<void>( resolve => setTimeout( resolve, milliseconds ) );
}

export function prepareUnitSearchString( search: string | undefined ): string {
	if ( !search || /^\s+$/.test( search ) ) {
		return '';
	}
	search = search.trim();
	// 25 minutes shouldn't be parsed as 2 <5 minutes>
	if ( /\d/.test( search[ 0 ] ) ) {
		search = ' ' + search;
	}
	return search.replace( /[-[\]/{}()*+?.\\^$|]/g, '\\$&' );
}

export async function queryIndexedDB( storeName: string, id: ItemId | PropertyId ): Promise<Property | Type | Unit | undefined> {
	const rows: ( Property | Type | Unit )[] = await bulkQueryIndexedDB( storeName, [ id ] );
	if ( !rows.length ) {
		return undefined;
	}
	return rows.pop();
}

export async function bulkQueryIndexedDB( storeName: string, ids: ( ItemId | PropertyId )[] ): Promise<any> {
	if ( !Array.isArray( ids ) || !ids.length ) {
		console.debug( 'bulkQueryIndexedDB() without IDs', storeName );
		return [];
	}
	return new Promise(
		function ( resolve, reject ): void {
			const openRequest: IDBOpenDBRequest = indexedDB.open( storeName, 3 );

			openRequest.onerror = () => reject( Error( 'IndexedDB error: ' + openRequest.error ) );

			openRequest.onupgradeneeded = function (): void {
				const db: IDBDatabase = openRequest.result;
				if ( db.objectStoreNames.contains( storeName ) ) {
					db.deleteObjectStore( storeName );
				}
				// eslint-disable-next-line
				const store: IDBObjectStore = db.createObjectStore( storeName, { keyPath: 'id' } );
			};

			openRequest.onsuccess = function (): void {
				const db: IDBDatabase = openRequest.result;
				const transaction: IDBTransaction = db.transaction( [ storeName ], 'readonly' );
				const objectStore: IDBObjectStore = transaction.objectStore( storeName );

				Promise.all( ids.map(
					( id: ItemId | PropertyId ) => new Promise( ( resolve, reject ): void => {
						const objectRequest: IDBRequest = objectStore.get( id );
						objectRequest.onerror = () => reject( Error( 'IDBObjectStore error: ' + objectRequest.error ) );
						objectRequest.onsuccess = () => ( resolve( objectRequest.result ) );
					} )
				) ).then( ( rows: any[] ) => resolve( rows.filter( ( row ) => row ) ) );
			};
		}
	);
}

export async function bulkInsertIndexedDB( storeName: string, data: any[] ): Promise<any | undefined> {
	if ( !data.length ) {
		return;
	}
	return new Promise(
		function ( resolve, reject ): void {
			const openRequest: IDBOpenDBRequest = indexedDB.open( storeName, 3 );

			openRequest.onerror = function (): void {
				reject( Error( 'IndexedDB error: ' + openRequest.error ) );
			};

			openRequest.onupgradeneeded = function (): void {
				const db: IDBDatabase = openRequest.result;
				if ( db.objectStoreNames.contains( storeName ) ) {
					db.deleteObjectStore( storeName );
				}
				// eslint-disable-next-line
				const store: IDBObjectStore = db.createObjectStore( storeName, { keyPath: 'id' } );
			};

			openRequest.onsuccess = function (): void {
				const db: IDBDatabase = openRequest.result;
				const transaction: IDBTransaction = db.transaction( [ storeName ], 'readwrite' );
				const objectStore: IDBObjectStore = transaction.objectStore( storeName );
				let objectRequest: IDBRequest | undefined;
				for ( const value of data ) {
					objectRequest = objectStore.put( value );
				}

				objectRequest.onerror = () => reject( Error( 'IDBObjectStore error: ' + objectRequest.error ) );
				objectRequest.onsuccess = () => resolve( objectRequest.result );
			};
		}
	);
}
