import type { Reference, SnaksObject } from '../types/wikidata/main';
import { getConfig } from '../config';
import { createTimeValue } from './time';
import type { TimeValue } from '../types/wikidata/values';

/**
 * Extract reference URL
 */
export function getReferences( $field: JQuery ): Reference[] {
	const references: Reference[] = [];
	const $notes: JQuery = $field.find( 'sup.reference a' );
	for ( let i: number = 0; i < $notes.length; i++ ) {
		// @ts-ignore
		const $externalLinks: JQuery = $( decodeURIComponent( $notes[ i ].hash ).replace( /[!"$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&' ) + ' a[rel="nofollow"]' );
		for ( let j: number = 0; j < $externalLinks.length; j++ ) {
			const $externalLink: JQuery = $( $externalLinks.get( j ) );
			if ( !$externalLink.attr( 'href' ).match( /(wikipedia.org|webcitation.org|archive.is)/ ) ) {
				const source: Reference = {
					snaks: {
						P854: [ {
							property: 'P854',
							datatype: 'url',
							snaktype: 'value',
							datavalue: {
								type: 'string',
								value: $externalLink.attr( 'href' ).replace( /^\/\//, 'https://' )
							}
						} ]
					}
				};

				// P813
				if ( getConfig( 'mark-checked' ) !== '' ) {
					const $accessed: JQuery = $externalLinks.parent().find( 'small:contains("' + getConfig( 'mark-checked' ) + '")' );
					if ( $accessed.length ) {
						const accessDate: TimeValue = createTimeValue( $accessed.first().text() );
						if ( accessDate ) {
							source.snaks.P813 = [ {
								property: 'P813',
								datatype: 'time',
								snaktype: 'value',
								datavalue: {
									type: 'time',
									value: accessDate
								}
							} ];
						}
					}
				}

				// P1065 + P2960
				if ( getConfig( 'mark-archived' ) !== '' ) {
					const $archiveLinks: JQuery = $externalLinks.filter( 'a:contains("' + getConfig( 'mark-archived' ) + '")' );
					if ( $archiveLinks.length ) {
						const $archiveLink: JQuery = $archiveLinks.first();
						source.snaks.P1065 = [ {
							property: 'P1065',
							datatype: 'url',
							snaktype: 'value',
							datavalue: {
								type: 'string',
								value: $archiveLink.attr( 'href' ).replace( /^\/\//, 'https://' )
							}
						} ];

						const archiveDate: TimeValue = createTimeValue( $archiveLink.parent().text().replace( getConfig( 'mark-archived' ), '' ).trim() );
						if ( archiveDate ) {
							source.snaks.P2960 = [ {
								property: 'P2960',
								datatype: 'time',
								snaktype: 'value',
								datavalue: {
									type: 'time',
									value: archiveDate
								}
							} ];
						}
					}
				}

				references.push( source );
				break;
			}
		}
	}

	const mw = require( 'mw' );
	const defaultReferenceSnaks: SnaksObject = getConfig( 'references' );
	defaultReferenceSnaks.P4656 = [ {
		property: 'P4656',
		datatype: 'url',
		snaktype: 'value',
		datavalue: {
			type: 'string',
			value: 'https://' + location.host + '/?oldid=' + mw.config.get( 'wgRevisionId' )
		}
	} ];
	references.push( { snaks: defaultReferenceSnaks } );

	return references;
}
