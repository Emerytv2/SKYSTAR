// utils.js
// Funkcje pomocnicze (formatowanie, konwersja znaków, itp.)

class Utils {
  static formatPosition(pos) {
    return `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`;
  }

  static asciiReplaceExceptO(str) {
    // Zamienia polskie znaki na ascii, poza "ó" i "Ó"
    return str
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n')
      .replace(/ś/g, 's').replace(/ż/g, 'z').replace(/ź/g, 'z')
      .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E')
      .replace(/Ł/g, 'L').replace(/Ń/g, 'N')
      .replace(/Ś/g, 'S').replace(/Ż/g, 'Z').replace(/Ź/g, 'Z');
  }
}

PlaygroundApp.prototype.toAsciiExceptO = function(text) {
  return Utils.asciiReplaceExceptO(text);
};
