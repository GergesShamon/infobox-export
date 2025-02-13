import type { ItemLabel, KeyValue, Property } from './types/main';
import type { Reference, Snak } from './types/wikidata/main';
import type { PropertyId } from './types/wikidata/types';
import type { ExternalIdValue, ItemValue, StringValue, TimeValue, UrlValue } from './types/wikidata/values';
import { getI18n } from './i18n';
import { getItemLabel, wbFormatValue } from './wikidata';
import { userLanguage } from './languages';
import { getConfig, getOrLoadProperty } from './config';

function getRefSup( url: string, text: string ): JQuery {
	const $link: JQuery = $( '<a>' )
		.attr( 'href', url )
		.attr( 'rel', 'noopener noreferrer' )
		.attr( 'target', '_blank' )
		.text( `[${ text }]` );
	return $( '<sup>' )
		.addClass( 'infobox-export-sup' )
		.append( $link );
}

function formatReference( reference: Reference ): JQuery | void {
	const p854: Snak[] = reference.snaks.P854;
	if ( !p854 || !p854.length ) {
		return;
	}

	const url: UrlValue = p854[ 0 ].datavalue.value as UrlValue;
	let domain: string = url
		.replace( 'http://', '' )
		.replace( 'https://', '' )
		.replace( 'www.', '' );
	if ( domain.indexOf( '/' ) > 0 ) {
		domain = domain.slice( 0, domain.indexOf( '/' ) );
	}

	return getRefSup( url, domain );
}

export function formatReferences( references: Reference[] ): JQuery {
	const $result: JQuery = $( '<span>' );
	for ( let i: number = 0; i < references.length; i++ ) {
		const $refSup: JQuery | void = formatReference( references[ i ] );
		if ( $refSup ) {
			$result.append( $refSup );
		}
	}
	return $result;
}

export async function formatExternalId( value: ExternalIdValue | StringValue, propertyId?: PropertyId ): Promise<JQuery> {
	const $mainLabel: JQuery = $( '<span>' )
		.addClass( 'infobox-export-main-label' )
		.text( value );
	const $label: JQuery = $( '<span>' ).append( $mainLabel );
	if ( propertyId ) {
		const property: Property | undefined = await getOrLoadProperty( propertyId );
		const formatter: string | undefined = property?.formatter;
		if ( formatter ) {
			const $link = $( '<a>' )
				.addClass( 'infobox-export-external-link' )
				.attr( 'href', formatter.replace( '$1', value ) )
				.attr( 'rel', 'noopener noreferrer' )
				.attr( 'target', '_blank' );
			$label.append( $link );
		}
	}
	return $label;
}

export async function formatGlobeCoordinateSnak( snak: Snak ): Promise<JQuery> {
	const $label: JQuery = await wbFormatValue( snak );

	$label.find( '.mw-kartographer-map img' ).each( function () {
		const $img: JQuery = $( this );
		const title: string = location.pathname.replace( '/wiki/', '' );

		$img.attr( 'src', $img.attr( 'src' )
			.replace( /domain=[^&]+/, 'domain=' + location.host )
			.replace( /title=[^&]+/, 'title=' + title ) );

		$img.attr( 'srcset', $img.attr( 'srcset' )
			.replace( /domain=[^&]+/, 'domain=' + location.host )
			.replace( /title=[^&]+/, 'title=' + title ) );
	} );

	return $label;
}

export async function formatItemValue( value: ItemValue ): Promise<JQuery> {
	const itemLabel: ItemLabel = await getItemLabel( value.id );
	const $mainLabel: JQuery = $( '<span>' )
		.addClass( 'infobox-export-main-label' )
		.text( itemLabel?.label || '' );
	const $wdLink: JQuery = getRefSup( `https://wikidata.org/wiki/${ value.id }`, 'd' );
	const $label: JQuery = $( '<span>' ).append( $mainLabel, $wdLink );
	if ( itemLabel?.description ) {
		$label.append( $( '<span>' ).text( ' — ' + itemLabel.description ) );
	}
	return $label;
}

function formatTimeValue( value: TimeValue ): JQuery {
	const $label: JQuery = $( '<span>' );
	const bceMark: string = ( value.time.charAt( 0 ) === '-' ? getI18n( 'bce-postfix' ) : '' );

	let dateString: string;
	if ( value.precision === 7 ) {
		const century: number = Math.floor( ( parseInt( value.time.slice( 1, 5 ), 10 ) - 1 ) / 100 );
		dateString = getConfig( `centuries.${ century }` ) + getI18n( 'age-postfix' ) + bceMark;
	} else {
		const options: KeyValue = {
			timeZone: 'UTC'
		};
		if ( value.precision > 7 ) {
			options.year = 'numeric';
		}
		if ( value.precision > 9 ) {
			options.month = 'long';
		}
		if ( value.precision > 10 ) {
			options.day = 'numeric';
		}
		const parsedDate: Date = new Date( Date.parse( value.time.slice( 1 ).replace( /-00/g, '-01' ) ) );
		dateString = parsedDate.toLocaleString( userLanguage, options ) + ( value.precision === 8 ? getI18n( 'decade-postfix' ) : '' ) + bceMark;
	}
	const calendar: string = value.calendarmodel.includes( '1985727' ) ? getI18n( 'grigorian-calendar' ) : getI18n( 'julian-calendar' );

	$label
		.append( $( '<strong>' ).text( dateString ) )
		.append( $( '<span>' ).text( calendar ).addClass( 'infobox-export-calendar' ) );

	return $label;
}

/**
 * Formatting wikidata values for display to the user
 */
export async function formatSnak( snak: Snak ): Promise<JQuery> {
	if ( snak.snaktype === 'novalue' ) {
		return $( '<span>' )
			.addClass( 'infobox-export-novalue' )
			.text( getI18n( 'value-prefix' ) + getI18n( 'no-value' ) );
	}
	if ( snak.snaktype === 'somevalue' ) {
		return $( '<span>' )
			.addClass( 'infobox-export-somevalue' )
			.text( getI18n( 'value-prefix' ) + getI18n( 'unknown-value' ) );
	}

	switch ( snak.datatype ) {
		case 'external-id':
			// ID [link]
			return formatExternalId( snak.datavalue.value as ExternalIdValue, snak.property );

		case 'globe-coordinate':
			return formatGlobeCoordinateSnak( snak );

		case 'time':
			// '''XIV century''' (Julian)
			return formatTimeValue( snak.datavalue.value as TimeValue );

		case 'wikibase-item':
			// '''Label''': description
			return formatItemValue( snak.datavalue.value as ItemValue );
	}

	return wbFormatValue( snak );
}
