/**
 * The rule of the pictures.
 *
 * A picture of a page is a picture of `next/image`, which gives the sizes,
 * the formats and the lazy loading of it, and it is never a raw `<img>` with
 * a file of the source: a raw picture is the whole file of the source, it has
 * no size before it arrives, and it is never lazy.
 *
 * A picture of `next/image` that does not say how big it is takes the place
 * of the text when it arrives, and the page moves under the reader of the
 * page. It carries `width` and `height`, or `fill`.
 *
 * The rule is a rule on the source, and the measurement of the site reads the
 * source and fails when a file does it. The measurement is in
 * `scripts/measurePerformance.mts`.
 */

/** A file of the site that breaks the rule of the pictures. */
export interface PictureFailure {
  /** The file that breaks the rule. */
  file: string;
  /** The line of the file where the picture is. */
  line: number;
  /** What the file does. */
  note: string;
}

/** A picture that the rule found in a file. */
interface FoundPicture {
  /** The line of the file where the picture is. */
  line: number;
  /** The name of the component of the picture. */
  name: string;
  /** The attributes of the tag of the picture. */
  attributes: string;
}

/**
 * Counts the lines of a source up to a place in it.
 *
 * @param source The source of the file.
 * @param index The place in the source.
 * @returns The number of the line, counted from one.
 */
function countLines(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

/**
 * Finds the raw pictures of a file.
 *
 * The tag of a picture of the DOM is `<img>`, and it is the only way to put
 * a file of the source in a page without the framework. The tag of an SVG
 * inside a page is not a picture of a file, and it is not found here.
 *
 * @param source The source of the file.
 * @returns The raw pictures of the file, with the line they are on.
 */
export function findRawPictures(source: string): { line: number }[] {
  const found: { line: number }[] = [];

  for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
    found.push({ line: countLines(source, match.index) });
  }

  return found;
}

/**
 * Finds the names that a file gives to the picture of `next/image`.
 *
 * The picture of the framework is imported by its default, and the name it
 * is imported under is the name of the component in the file.
 *
 * @param source The source of the file.
 * @returns The names of the picture of `next/image` in the file.
 */
export function findNextImageNames(source: string): string[] {
  const names: string[] = [];

  for (const match of source.matchAll(
    /import\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"]next\/image['"]/g
  )) {
    names.push(match[1]);
  }

  return names;
}

/**
 * Finds the pictures of `next/image` that do not say how big they are.
 *
 * @param source The source of the file.
 * @returns The pictures without their sizes, with the line they are on.
 */
export function findPicturesWithoutSizes(source: string): FoundPicture[] {
  const names = findNextImageNames(source);
  const found: FoundPicture[] = [];

  if (names.length === 0) {
    return found;
  }

  for (const name of names) {
    const pattern = new RegExp(`<${name}\\b([^>]*?)/?>`, 'g');

    for (const match of source.matchAll(pattern)) {
      const attributes = match[1];
      const hasSize = /\bwidth\s*=/.test(attributes) && /\bheight\s*=/.test(attributes);
      const fills = /\bfill\b/.test(attributes);

      if (hasSize || fills) {
        continue;
      }

      found.push({
        line: countLines(source, match.index),
        name,
        attributes: attributes.replace(/\s+/g, ' ').trim(),
      });
    }
  }

  return found;
}

/**
 * Checks the pictures of every file of the site.
 *
 * @param files The files of the site and their source.
 * @returns The files that break the rule, with the reason.
 */
export function checkPictures(files: { file: string; source: string }[]): PictureFailure[] {
  const failures: PictureFailure[] = [];

  for (const { file, source } of files) {
    for (const picture of findRawPictures(source)) {
      failures.push({
        file,
        line: picture.line,
        note: 'a raw <img> with a file of the source: a picture of a page is a picture of next/image, which gives the sizes, the formats and the lazy loading of it',
      });
    }

    for (const picture of findPicturesWithoutSizes(source)) {
      failures.push({
        file,
        line: picture.line,
        note: `the picture <${picture.name}> does not say how big it is: it carries width and height, or fill, so that the page does not move when the picture arrives`,
      });
    }
  }

  return failures;
}
