export const csvToArray = ({
  strData,
  strDelimiter = ',',
  header = true,
}: {
  strData: string;
  strDelimiter?: string;
  header?: boolean;
}) => {
  // Create a regular expression to parse the CSV values.
  const objPattern = new RegExp(
    // Delimiters.
    '(\\' +
      strDelimiter +
      '|\\r?\\n|\\r|^)' +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      strDelimiter +
      '\\r\\n]*))',
    'gi',
  );
  // Create an array to hold our data. Give the array
  // a default empty first row.
  const arrData: string[][] = [[]];
  // Create an array to hold our individual pattern
  // matching groups.
  let arrMatches = null;
  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while ((arrMatches = objPattern.exec(strData))) {
    // Get the delimiter that was found.
    const strMatchedDelimiter = arrMatches[1];
    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter?.length && strMatchedDelimiter !== strDelimiter) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);
    }
    let strMatchedValue: string;
    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
    } else {
      // We found a non-quoted value.

      strMatchedValue = String(arrMatches[3]);
    }
    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1]?.push(strMatchedValue);
  }

  return { header: header ? arrData.shift() ?? [] : [], body: arrData };
};

export const combineArrays = <T extends Record<string, string>>(
  header: (keyof T)[],
  body: T[keyof T][],
  confirm?: (val: unknown) => boolean,
) => {
  const result = {} as T;
  header.forEach((key, i) => {
    const item = body[i];
    if (item) {
      result[key] = item;
    }
  });

  if (confirm && !confirm(result)) {
    return null;
  }

  return result;
};

export const parseCsv = <Keys extends string>(opts: {
  data: string;
  headerExists: boolean;
  confirm?: (val: unknown) => boolean;
}) => {
  const { data, confirm, headerExists = true } = opts;

  const csvArr = csvToArray({ strData: data, header: headerExists });

  const result = csvArr.body.map(row => {
    return combineArrays<Record<Keys, string>>(
      csvArr.header as Keys[],
      row,
      confirm,
    );
  });

  return result;
};
