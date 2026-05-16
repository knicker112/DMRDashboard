export interface CountryInfo {
  iso: string   // ISO 3166-1 alpha-2
  name: string  // German country name
  flag: string  // Flag emoji
}

function isoToFlag(iso: string): string {
  return [...iso.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('')
}

// [callsign prefix, ISO 3166-1 alpha-2, German name]
const RAW: [string, string, string][] = [
  // ── 3-char (must match before 2-char) ─────────────────────
  ['HB0', 'LI', 'Liechtenstein'],
  ['KH0', 'MP', 'Nördliche Marianen'],
  ['KH2', 'GU', 'Guam'],
  ['KH6', 'US', 'USA'],
  ['KH8', 'AS', 'Amerikanisch-Samoa'],
  ['KL7', 'US', 'USA'],
  ['KP2', 'VI', 'US-Jungferninseln'],
  ['KP4', 'PR', 'Puerto Rico'],
  ['VP2', 'GB', 'Großbritannien'],
  ['VP5', 'TC', 'Turks- und Caicosinseln'],
  ['VP6', 'PN', 'Pitcairninseln'],
  ['VP8', 'FK', 'Falklandinseln'],
  ['VP9', 'BM', 'Bermuda'],
  ['VQ9', 'IO', 'Britisches Territorium im Indischen Ozean'],
  ['ZD7', 'SH', 'St. Helena'],
  ['ZD8', 'AC', 'Ascension'],
  ['ZD9', 'TA', 'Tristan da Cunha'],

  // ── 2-char ─────────────────────────────────────────────────

  // Deutschland
  ['DA', 'DE', 'Deutschland'], ['DB', 'DE', 'Deutschland'], ['DC', 'DE', 'Deutschland'],
  ['DD', 'DE', 'Deutschland'], ['DE', 'DE', 'Deutschland'], ['DF', 'DE', 'Deutschland'],
  ['DG', 'DE', 'Deutschland'], ['DH', 'DE', 'Deutschland'], ['DI', 'DE', 'Deutschland'],
  ['DJ', 'DE', 'Deutschland'], ['DK', 'DE', 'Deutschland'], ['DL', 'DE', 'Deutschland'],
  ['DM', 'DE', 'Deutschland'], ['DN', 'DE', 'Deutschland'], ['DO', 'DE', 'Deutschland'],
  ['DP', 'DE', 'Deutschland'], ['DQ', 'DE', 'Deutschland'], ['DR', 'DE', 'Deutschland'],
  // Südkorea
  ['DS', 'KR', 'Südkorea'], ['DT', 'KR', 'Südkorea'],
  // Philippinen
  ['DU', 'PH', 'Philippinen'], ['DV', 'PH', 'Philippinen'], ['DW', 'PH', 'Philippinen'],
  ['DX', 'PH', 'Philippinen'], ['DY', 'PH', 'Philippinen'], ['DZ', 'PH', 'Philippinen'],
  ['4D', 'PH', 'Philippinen'], ['4E', 'PH', 'Philippinen'], ['4F', 'PH', 'Philippinen'],
  ['4G', 'PH', 'Philippinen'], ['4H', 'PH', 'Philippinen'], ['4I', 'PH', 'Philippinen'],

  // Österreich
  ['OE', 'AT', 'Österreich'],
  // Schweiz
  ['HB', 'CH', 'Schweiz'], ['HE', 'CH', 'Schweiz'],
  // Luxemburg
  ['LX', 'LU', 'Luxemburg'],
  // Belgien
  ['ON', 'BE', 'Belgien'], ['OO', 'BE', 'Belgien'], ['OQ', 'BE', 'Belgien'],
  ['OR', 'BE', 'Belgien'], ['OS', 'BE', 'Belgien'], ['OT', 'BE', 'Belgien'],
  // Niederlande
  ['PA', 'NL', 'Niederlande'], ['PB', 'NL', 'Niederlande'], ['PC', 'NL', 'Niederlande'],
  ['PD', 'NL', 'Niederlande'], ['PE', 'NL', 'Niederlande'], ['PF', 'NL', 'Niederlande'],
  ['PG', 'NL', 'Niederlande'], ['PH', 'NL', 'Niederlande'], ['PI', 'NL', 'Niederlande'],

  // Großbritannien (Sonderpräfixe)
  ['GD', 'GB', 'Großbritannien'], ['GI', 'GB', 'Großbritannien'],
  ['GJ', 'GB', 'Großbritannien'], ['GM', 'GB', 'Großbritannien'],
  ['GU', 'GB', 'Großbritannien'], ['GW', 'GB', 'Großbritannien'],
  ['2E', 'GB', 'Großbritannien'], ['2I', 'GB', 'Großbritannien'],
  ['2M', 'GB', 'Großbritannien'], ['2W', 'GB', 'Großbritannien'],
  ['ZB', 'GI', 'Gibraltar'],
  ['ZD', 'GB', 'Großbritannien'],
  ['ZF', 'KY', 'Kaimaninseln'],

  // Irland
  ['EI', 'IE', 'Irland'], ['EJ', 'IE', 'Irland'],
  // Spanien
  ['EA', 'ES', 'Spanien'], ['EB', 'ES', 'Spanien'], ['EC', 'ES', 'Spanien'],
  ['ED', 'ES', 'Spanien'], ['EF', 'ES', 'Spanien'], ['EG', 'ES', 'Spanien'],
  ['EH', 'ES', 'Spanien'],
  // Portugal (CT3 = Madeira, CU = Azoren, alle PT)
  ['CT', 'PT', 'Portugal'], ['CS', 'PT', 'Portugal'], ['CU', 'PT', 'Portugal'],
  // Frankreich (Sonderpräfixe)
  ['TK', 'FR', 'Frankreich'], ['TM', 'FR', 'Frankreich'],
  ['TO', 'FR', 'Frankreich'], ['TQ', 'FR', 'Frankreich'],
  ['FK', 'NC', 'Neukaledonien'],
  ['FG', 'GP', 'Guadeloupe'],
  ['FM', 'MQ', 'Martinique'],
  ['FO', 'PF', 'Französisch-Polynesien'],
  ['FP', 'PM', 'Saint-Pierre und Miquelon'],
  ['FR', 'RE', 'Réunion'],
  ['FS', 'MF', 'Saint-Martin'],
  ['FY', 'GF', 'Französisch-Guayana'],
  // Italien
  // (nur 1-Zeichen "I" nötig — alle italienischen Rufzeichen beginnen mit I)
  // San Marino
  ['T7', 'SM', 'San Marino'],
  // Vatikanstadt
  ['HV', 'VA', 'Vatikanstadt'],
  // Malta
  ['9H', 'MT', 'Malta'],
  // Monaco
  ['3A', 'MC', 'Monaco'],
  // Andorra
  ['C3', 'AD', 'Andorra'],
  // Island
  ['TF', 'IS', 'Island'],
  // Dänemark
  ['OZ', 'DK', 'Dänemark'],
  // Färöer
  ['OY', 'FO', 'Färöer'],
  // Grönland
  ['OX', 'GL', 'Grönland'],
  // Norwegen
  ['LA', 'NO', 'Norwegen'], ['LB', 'NO', 'Norwegen'], ['LC', 'NO', 'Norwegen'],
  ['LD', 'NO', 'Norwegen'], ['LE', 'NO', 'Norwegen'], ['LF', 'NO', 'Norwegen'],
  ['LG', 'NO', 'Norwegen'], ['LH', 'NO', 'Norwegen'], ['LI', 'NO', 'Norwegen'],
  ['LJ', 'NO', 'Norwegen'], ['LK', 'NO', 'Norwegen'], ['LL', 'NO', 'Norwegen'],
  ['LM', 'NO', 'Norwegen'], ['LN', 'NO', 'Norwegen'],
  ['JW', 'NO', 'Norwegen'], ['JX', 'NO', 'Norwegen'], ['3Y', 'NO', 'Norwegen'],
  // Schweden
  ['SK', 'SE', 'Schweden'], ['SL', 'SE', 'Schweden'], ['SM', 'SE', 'Schweden'],
  // Finnland
  ['OH', 'FI', 'Finnland'],
  // Estland
  ['ES', 'EE', 'Estland'],
  // Lettland
  ['YL', 'LV', 'Lettland'],
  // Litauen
  ['LY', 'LT', 'Litauen'],
  // Polen
  ['SN', 'PL', 'Polen'], ['SO', 'PL', 'Polen'], ['SP', 'PL', 'Polen'],
  ['SQ', 'PL', 'Polen'], ['SR', 'PL', 'Polen'],
  // Tschechien
  ['OK', 'CZ', 'Tschechien'], ['OL', 'CZ', 'Tschechien'],
  // Slowakei
  ['OM', 'SK', 'Slowakei'],
  // Ungarn
  ['HA', 'HU', 'Ungarn'], ['HG', 'HU', 'Ungarn'],
  // Rumänien
  ['YO', 'RO', 'Rumänien'], ['YP', 'RO', 'Rumänien'],
  ['YQ', 'RO', 'Rumänien'], ['YR', 'RO', 'Rumänien'],
  // Bulgarien
  ['LZ', 'BG', 'Bulgarien'],
  // Moldau
  ['ER', 'MD', 'Moldau'],
  // Ukraine
  ['UR', 'UA', 'Ukraine'], ['US', 'UA', 'Ukraine'], ['UT', 'UA', 'Ukraine'],
  ['UU', 'UA', 'Ukraine'], ['UV', 'UA', 'Ukraine'], ['UW', 'UA', 'Ukraine'],
  ['UX', 'UA', 'Ukraine'], ['UY', 'UA', 'Ukraine'], ['UZ', 'UA', 'Ukraine'],
  // Belarus
  ['EU', 'BY', 'Belarus'], ['EV', 'BY', 'Belarus'], ['EW', 'BY', 'Belarus'],
  // Russland (UA-UI ohne UR-UZ = Russland; RA-RZ = Russland)
  ['UA', 'RU', 'Russland'], ['UB', 'RU', 'Russland'], ['UC', 'RU', 'Russland'],
  ['UD', 'RU', 'Russland'], ['UE', 'RU', 'Russland'], ['UF', 'RU', 'Russland'],
  ['UG', 'RU', 'Russland'], ['UH', 'RU', 'Russland'], ['UI', 'RU', 'Russland'],
  ['RA', 'RU', 'Russland'], ['RB', 'RU', 'Russland'], ['RC', 'RU', 'Russland'],
  ['RD', 'RU', 'Russland'], ['RE', 'RU', 'Russland'], ['RF', 'RU', 'Russland'],
  ['RG', 'RU', 'Russland'], ['RK', 'RU', 'Russland'], ['RL', 'RU', 'Russland'],
  ['RM', 'RU', 'Russland'], ['RN', 'RU', 'Russland'], ['RO', 'RU', 'Russland'],
  ['RP', 'RU', 'Russland'], ['RQ', 'RU', 'Russland'], ['RT', 'RU', 'Russland'],
  ['RU', 'RU', 'Russland'], ['RV', 'RU', 'Russland'], ['RW', 'RU', 'Russland'],
  ['RX', 'RU', 'Russland'], ['RY', 'RU', 'Russland'], ['RZ', 'RU', 'Russland'],
  // Kasachstan
  ['UN', 'KZ', 'Kasachstan'], ['UO', 'KZ', 'Kasachstan'], ['UP', 'KZ', 'Kasachstan'],
  ['UQ', 'KZ', 'Kasachstan'],
  // Usbekistan
  ['UK', 'UZ', 'Usbekistan'],
  // Turkmenistan
  ['EZ', 'TM', 'Turkmenistan'],
  // Kirgisistan
  ['EX', 'KG', 'Kirgisistan'],
  // Tadschikistan
  ['EY', 'TJ', 'Tadschikistan'],
  // Armenien
  ['EK', 'AM', 'Armenien'],
  // Aserbaidschan
  ['4J', 'AZ', 'Aserbaidschan'], ['4K', 'AZ', 'Aserbaidschan'],
  // Georgien
  ['4L', 'GE', 'Georgien'],
  // Griechenland
  ['SV', 'GR', 'Griechenland'], ['J4', 'GR', 'Griechenland'],
  // Zypern
  ['5B', 'CY', 'Zypern'], ['H2', 'CY', 'Zypern'], ['P3', 'CY', 'Zypern'],
  // Türkei
  ['TA', 'TR', 'Türkei'], ['TB', 'TR', 'Türkei'], ['TC', 'TR', 'Türkei'],
  // Albanien
  ['ZA', 'AL', 'Albanien'],
  // Nordmazedonien
  ['Z3', 'MK', 'Nordmazedonien'],
  // Serbien
  ['YT', 'RS', 'Serbien'], ['YU', 'RS', 'Serbien'],
  // Montenegro
  ['4O', 'ME', 'Montenegro'],
  // Bosnien und Herzegowina
  ['E7', 'BA', 'Bosnien und Herzegowina'],
  // Kroatien
  ['9A', 'HR', 'Kroatien'],
  // Slowenien
  ['S5', 'SI', 'Slowenien'],
  // Kosovo
  ['Z6', 'XK', 'Kosovo'],
  // Israel
  ['4X', 'IL', 'Israel'], ['4Z', 'IL', 'Israel'],
  // Palästina
  ['E4', 'PS', 'Palästina'],
  // Libanon
  ['OD', 'LB', 'Libanon'],
  // Syrien
  ['YK', 'SY', 'Syrien'],
  // Jordanien
  ['JY', 'JO', 'Jordanien'],
  // Irak
  ['YI', 'IQ', 'Irak'],
  // Iran
  ['EP', 'IR', 'Iran'], ['EQ', 'IR', 'Iran'],
  // Saudi-Arabien
  ['HZ', 'SA', 'Saudi-Arabien'], ['7Z', 'SA', 'Saudi-Arabien'],
  // VAE
  ['A6', 'AE', 'Vereinigte Arabische Emirate'],
  // Katar
  ['A7', 'QA', 'Katar'],
  // Bahrain
  ['A9', 'BH', 'Bahrain'],
  // Oman
  ['A4', 'OM', 'Oman'],
  // Kuwait
  ['9K', 'KW', 'Kuwait'],
  // Jemen
  ['7O', 'YE', 'Jemen'],
  // Ägypten
  ['SU', 'EG', 'Ägypten'],
  // Sudan
  ['ST', 'SD', 'Sudan'],
  // Äthiopien
  ['ET', 'ET', 'Äthiopien'],
  // Eritrea
  ['E3', 'ER', 'Eritrea'],
  // Dschibuti
  ['J2', 'DJ', 'Dschibuti'],
  // Somalia
  ['T5', 'SO', 'Somalia'], ['6O', 'SO', 'Somalia'],
  // Kenia
  ['5Y', 'KE', 'Kenia'], ['5Z', 'KE', 'Kenia'],
  // Uganda
  ['5X', 'UG', 'Uganda'],
  // Tansania
  ['5H', 'TZ', 'Tansania'],
  // Ruanda
  ['9X', 'RW', 'Ruanda'],
  // Burundi
  ['9U', 'BI', 'Burundi'],
  // DR Kongo
  ['9O', 'CD', 'DR Kongo'], ['9P', 'CD', 'DR Kongo'], ['9Q', 'CD', 'DR Kongo'],
  ['9R', 'CD', 'DR Kongo'], ['9S', 'CD', 'DR Kongo'], ['9T', 'CD', 'DR Kongo'],
  // Republik Kongo
  ['TN', 'CG', 'Republik Kongo'],
  // Gabun
  ['TR', 'GA', 'Gabun'],
  // Kamerun
  ['TJ', 'CM', 'Kamerun'],
  // Zentralafrikanische Republik
  ['TL', 'CF', 'Zentralafrikanische Republik'],
  // Tschad
  ['TT', 'TD', 'Tschad'],
  // Nigeria
  ['5N', 'NG', 'Nigeria'],
  // Ghana
  ['9G', 'GH', 'Ghana'],
  // Elfenbeinküste
  ['TU', 'CI', 'Elfenbeinküste'],
  // Benin
  ['TY', 'BJ', 'Benin'],
  // Togo
  ['5V', 'TG', 'Togo'],
  // Niger
  ['5U', 'NE', 'Niger'],
  // Mali
  ['TZ', 'ML', 'Mali'],
  // Burkina Faso
  ['XT', 'BF', 'Burkina Faso'],
  // Mauretanien
  ['5T', 'MR', 'Mauretanien'],
  // Senegal
  ['6W', 'SN', 'Senegal'],
  // Gambia
  ['C5', 'GM', 'Gambia'],
  // Guinea
  ['3X', 'GN', 'Guinea'],
  // Guinea-Bissau
  ['J5', 'GW', 'Guinea-Bissau'],
  // Sierra Leone
  ['9L', 'SL', 'Sierra Leone'],
  // Liberia
  ['EL', 'LR', 'Liberia'],
  // Kapverden
  ['D4', 'CV', 'Kap Verde'],
  // São Tomé und Príncipe
  ['S9', 'ST', 'São Tomé und Príncipe'],
  // Äquatorialguinea
  ['3C', 'GQ', 'Äquatorialguinea'],
  // Angola
  ['D2', 'AO', 'Angola'], ['D3', 'AO', 'Angola'],
  // Sambia
  ['9I', 'ZM', 'Sambia'], ['9J', 'ZM', 'Sambia'],
  // Malawi
  ['7Q', 'MW', 'Malawi'],
  // Mosambik
  ['C8', 'MZ', 'Mosambik'], ['C9', 'MZ', 'Mosambik'],
  // Simbabwe
  ['Z2', 'ZW', 'Simbabwe'],
  // Botswana
  ['A2', 'BW', 'Botswana'],
  // Namibia
  ['V5', 'NA', 'Namibia'],
  // Südafrika
  ['ZR', 'ZA', 'Südafrika'], ['ZS', 'ZA', 'Südafrika'],
  ['ZT', 'ZA', 'Südafrika'], ['ZU', 'ZA', 'Südafrika'],
  // Lesotho
  ['7P', 'LS', 'Lesotho'],
  // Eswatini
  ['3D', 'SZ', 'Eswatini'],
  // Madagaskar
  ['5R', 'MG', 'Madagaskar'],
  // Seychellen
  ['S7', 'SC', 'Seychellen'],
  // Mauritius
  ['3B', 'MU', 'Mauritius'],
  // Komoren
  ['D6', 'KM', 'Komoren'],
  // Marokko
  ['CN', 'MA', 'Marokko'],
  ['5C', 'MA', 'Marokko'], ['5D', 'MA', 'Marokko'], ['5E', 'MA', 'Marokko'],
  ['5F', 'MA', 'Marokko'], ['5G', 'MA', 'Marokko'],
  // Algerien
  ['7X', 'DZ', 'Algerien'],
  // Tunesien
  ['TS', 'TN', 'Tunesien'], ['3V', 'TN', 'Tunesien'],
  // Libyen
  ['5A', 'LY', 'Libyen'],

  // USA (AA-AL Blockvergabe + weitere)
  ['AA', 'US', 'USA'], ['AB', 'US', 'USA'], ['AC', 'US', 'USA'],
  ['AD', 'US', 'USA'], ['AE', 'US', 'USA'], ['AF', 'US', 'USA'],
  ['AG', 'US', 'USA'], ['AH', 'US', 'USA'], ['AI', 'US', 'USA'],
  ['AJ', 'US', 'USA'], ['AK', 'US', 'USA'], ['AL', 'US', 'USA'],
  // Kanada
  ['VA', 'CA', 'Kanada'], ['VB', 'CA', 'Kanada'], ['VC', 'CA', 'Kanada'],
  ['VD', 'CA', 'Kanada'], ['VE', 'CA', 'Kanada'], ['VF', 'CA', 'Kanada'],
  ['VG', 'CA', 'Kanada'], ['VO', 'CA', 'Kanada'],
  ['VX', 'CA', 'Kanada'], ['VY', 'CA', 'Kanada'],
  // Mexiko
  ['XE', 'MX', 'Mexiko'], ['XF', 'MX', 'Mexiko'],
  ['6D', 'MX', 'Mexiko'], ['6E', 'MX', 'Mexiko'], ['6F', 'MX', 'Mexiko'],
  ['6G', 'MX', 'Mexiko'], ['6H', 'MX', 'Mexiko'], ['6I', 'MX', 'Mexiko'],
  ['6J', 'MX', 'Mexiko'],
  // Guatemala
  ['TG', 'GT', 'Guatemala'],
  // Belize
  ['V3', 'BZ', 'Belize'],
  // Honduras
  ['HR', 'HN', 'Honduras'],
  // El Salvador
  ['YS', 'SV', 'El Salvador'],
  // Nicaragua
  ['YN', 'NI', 'Nicaragua'],
  // Costa Rica
  ['TI', 'CR', 'Costa Rica'],
  // Panama
  ['HP', 'PA', 'Panama'],
  // Kuba
  ['CM', 'CU', 'Kuba'], ['CO', 'CU', 'Kuba'],
  // Dominikanische Republik
  ['HI', 'DO', 'Dominikanische Republik'],
  // Haiti
  ['HH', 'HT', 'Haiti'],
  // Jamaika
  ['6Y', 'JM', 'Jamaika'],
  // Trinidad und Tobago
  ['9Y', 'TT', 'Trinidad und Tobago'], ['9Z', 'TT', 'Trinidad und Tobago'],
  // Barbados
  ['8P', 'BB', 'Barbados'],
  // Grenada
  ['J3', 'GD', 'Grenada'],
  // St. Lucia
  ['J6', 'LC', 'St. Lucia'],
  // St. Vincent
  ['J8', 'VC', 'St. Vincent und die Grenadinen'],
  // Dominica
  ['J7', 'DM', 'Dominica'],
  // Antigua und Barbuda
  ['V2', 'AG', 'Antigua und Barbuda'],
  // St. Kitts und Nevis
  ['V4', 'KN', 'St. Kitts und Nevis'],
  // Kolumbien
  ['HJ', 'CO', 'Kolumbien'], ['HK', 'CO', 'Kolumbien'],
  // Venezuela
  ['YV', 'VE', 'Venezuela'], ['YW', 'VE', 'Venezuela'], ['YX', 'VE', 'Venezuela'],
  // Trinidad (schon oben)
  // Guyana
  ['8R', 'GY', 'Guyana'],
  // Suriname
  ['PZ', 'SR', 'Suriname'],
  // Brasilien
  ['PP', 'BR', 'Brasilien'], ['PQ', 'BR', 'Brasilien'], ['PR', 'BR', 'Brasilien'],
  ['PS', 'BR', 'Brasilien'], ['PT', 'BR', 'Brasilien'], ['PU', 'BR', 'Brasilien'],
  ['PV', 'BR', 'Brasilien'], ['PW', 'BR', 'Brasilien'], ['PX', 'BR', 'Brasilien'],
  ['PY', 'BR', 'Brasilien'],
  // Ecuador
  ['HC', 'EC', 'Ecuador'], ['HD', 'EC', 'Ecuador'],
  // Peru
  ['OA', 'PE', 'Peru'], ['OB', 'PE', 'Peru'], ['OC', 'PE', 'Peru'],
  // Bolivien
  ['CP', 'BO', 'Bolivien'],
  // Paraguay
  ['ZP', 'PY', 'Paraguay'],
  // Uruguay
  ['CV', 'UY', 'Uruguay'], ['CX', 'UY', 'Uruguay'],
  // Argentinien
  ['LT', 'AR', 'Argentinien'], ['LU', 'AR', 'Argentinien'],
  ['LV', 'AR', 'Argentinien'], ['LW', 'AR', 'Argentinien'],
  // Chile
  ['CA', 'CL', 'Chile'], ['CB', 'CL', 'Chile'], ['CC', 'CL', 'Chile'],
  ['CD', 'CL', 'Chile'], ['CE', 'CL', 'Chile'],

  // Japan
  ['JA', 'JP', 'Japan'], ['JB', 'JP', 'Japan'], ['JC', 'JP', 'Japan'],
  ['JD', 'JP', 'Japan'], ['JE', 'JP', 'Japan'], ['JF', 'JP', 'Japan'],
  ['JG', 'JP', 'Japan'], ['JH', 'JP', 'Japan'], ['JI', 'JP', 'Japan'],
  ['JJ', 'JP', 'Japan'], ['JK', 'JP', 'Japan'], ['JL', 'JP', 'Japan'],
  ['JM', 'JP', 'Japan'], ['JN', 'JP', 'Japan'], ['JO', 'JP', 'Japan'],
  ['JP', 'JP', 'Japan'], ['JQ', 'JP', 'Japan'], ['JR', 'JP', 'Japan'],
  ['JS', 'JP', 'Japan'], ['7J', 'JP', 'Japan'],
  // Mongolei
  ['JT', 'MN', 'Mongolei'],
  // Südkorea (weitere Blöcke)
  ['6K', 'KR', 'Südkorea'], ['6L', 'KR', 'Südkorea'],
  ['6M', 'KR', 'Südkorea'], ['6N', 'KR', 'Südkorea'],
  // Nordkorea
  ['HM', 'KP', 'Nordkorea'], ['P5', 'KP', 'Nordkorea'],
  // China
  ['BA', 'CN', 'China'], ['BD', 'CN', 'China'], ['BG', 'CN', 'China'],
  ['BH', 'CN', 'China'], ['BJ', 'CN', 'China'], ['BK', 'CN', 'China'],
  ['BL', 'CN', 'China'], ['BN', 'CN', 'China'], ['BP', 'CN', 'China'],
  ['BR', 'CN', 'China'], ['BS', 'CN', 'China'], ['BT', 'CN', 'China'],
  ['BW', 'CN', 'China'], ['BY', 'CN', 'China'], ['BZ', 'CN', 'China'],
  // Taiwan
  ['BM', 'TW', 'Taiwan'], ['BO', 'TW', 'Taiwan'], ['BQ', 'TW', 'Taiwan'],
  ['BU', 'TW', 'Taiwan'], ['BV', 'TW', 'Taiwan'], ['BX', 'TW', 'Taiwan'],
  // Indien
  ['VU', 'IN', 'Indien'],
  ['AT', 'IN', 'Indien'], ['AU', 'IN', 'Indien'], ['AV', 'IN', 'Indien'],
  ['AW', 'IN', 'Indien'],
  // Pakistan
  ['AP', 'PK', 'Pakistan'], ['AQ', 'PK', 'Pakistan'],
  ['AR', 'PK', 'Pakistan'], ['AS', 'PK', 'Pakistan'],
  // Bangladesch
  ['S2', 'BD', 'Bangladesch'], ['S3', 'BD', 'Bangladesch'],
  // Sri Lanka
  ['4S', 'LK', 'Sri Lanka'],
  // Nepal
  ['9N', 'NP', 'Nepal'],
  // Bhutan
  ['A5', 'BT', 'Bhutan'],
  // Malediven
  ['8Q', 'MV', 'Malediven'],
  // Afghanistan
  ['YA', 'AF', 'Afghanistan'],
  // Myanmar
  ['XZ', 'MM', 'Myanmar'],
  // Thailand
  ['HS', 'TH', 'Thailand'], ['E2', 'TH', 'Thailand'],
  // Vietnam
  ['XV', 'VN', 'Vietnam'], ['3W', 'VN', 'Vietnam'],
  // Kambodscha
  ['XU', 'KH', 'Kambodscha'],
  // Laos
  ['XW', 'LA', 'Laos'],
  // Malaysia
  ['9M', 'MY', 'Malaysia'],
  // Singapur
  ['9V', 'SG', 'Singapur'],
  // Indonesien
  ['PK', 'ID', 'Indonesien'], ['PL', 'ID', 'Indonesien'], ['PM', 'ID', 'Indonesien'],
  ['PN', 'ID', 'Indonesien'], ['PO', 'ID', 'Indonesien'],
  ['YB', 'ID', 'Indonesien'], ['YC', 'ID', 'Indonesien'], ['YD', 'ID', 'Indonesien'],
  ['YE', 'ID', 'Indonesien'], ['YF', 'ID', 'Indonesien'], ['YG', 'ID', 'Indonesien'],
  ['YH', 'ID', 'Indonesien'],
  ['7A', 'ID', 'Indonesien'], ['7B', 'ID', 'Indonesien'], ['7C', 'ID', 'Indonesien'],
  ['7D', 'ID', 'Indonesien'], ['7E', 'ID', 'Indonesien'], ['7F', 'ID', 'Indonesien'],
  ['7G', 'ID', 'Indonesien'], ['7H', 'ID', 'Indonesien'], ['7I', 'ID', 'Indonesien'],
  // Osttimor
  ['4W', 'TL', 'Osttimor'],
  // Brunei
  ['V8', 'BN', 'Brunei'],
  // Australien
  ['VK', 'AU', 'Australien'],
  // Neuseeland
  ['ZK', 'NZ', 'Neuseeland'], ['ZL', 'NZ', 'Neuseeland'], ['ZM', 'NZ', 'Neuseeland'],
  // Papua-Neuguinea
  ['P2', 'PG', 'Papua-Neuguinea'],
  // Salomonen
  ['H4', 'SB', 'Salomonen'],
  // Vanuatu
  ['YJ', 'VU', 'Vanuatu'],
  // Fidschi
  ['3D', 'FJ', 'Fidschi'],
  // Tonga
  ['A3', 'TO', 'Tonga'],
  // Samoa
  ['5W', 'WS', 'Samoa'],
  // Kiribati
  ['T3', 'KI', 'Kiribati'],
  // Tuvalu
  ['T2', 'TV', 'Tuvalu'],
  // Nauru
  ['C2', 'NR', 'Nauru'],
  // Marshallinseln
  ['V7', 'MH', 'Marshallinseln'],
  // Mikronesien
  ['V6', 'FM', 'Mikronesien'],
  // Palau
  ['T8', 'PW', 'Palau'],
  // Hongkong
  ['VR', 'HK', 'Hongkong'],
  // Niue
  ['E6', 'NU', 'Niue'],
  // Cookinseln
  ['E5', 'CK', 'Cookinseln'],
  // Algerien (schon oben), Tunesien (schon oben)
  // Irak (schon oben)

  // ── 1-char ─────────────────────────────────────────────────
  ['F', 'FR', 'Frankreich'],
  ['G', 'GB', 'Großbritannien'],
  ['I', 'IT', 'Italien'],
  ['K', 'US', 'USA'],
  ['M', 'GB', 'Großbritannien'],
  ['N', 'US', 'USA'],
  ['W', 'US', 'USA'],
]

// Längste Präfixe zuerst prüfen
const SORTED = [...RAW].sort((a, b) => b[0].length - a[0].length)

export function callsignToCountry(callsign: string): CountryInfo | null {
  const upper = callsign.toUpperCase().trim()
  if (upper.length < 2) return null
  for (const [prefix, iso, name] of SORTED) {
    if (upper.startsWith(prefix)) {
      return { iso, name, flag: isoToFlag(iso) }
    }
  }
  return null
}
