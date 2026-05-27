const fs = require('fs');
const lines = fs.readFileSync('src/App.css', 'utf8').split('\n');
const results = [];
lines.forEach((line, i) => {
  if (line.includes('glass-container') || line.includes('calendar-column') || line.includes('overflow')) {
    results.push((i + 1) + ': ' + line.trim());
  }
});
fs.writeFileSync('find_output.txt', results.join('\n'), 'utf8');
