const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const buf = fs.readFileSync('/tmp/rufzeichenliste.pdf');
const parser = new PDFParse();
parser.pdf(buf, { max: 2 }).then(data => {
  console.log('Seiten:', data.numpages);
  console.log(data.text.slice(0, 4000));
}).catch(e => console.error(e.message, e.stack));
