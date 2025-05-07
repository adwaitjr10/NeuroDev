// migration/structureParser.js
export const extractPLSQLBlocks = (sqlText) => {
    const blocks = [];
    const regex = /(?=\b(CREATE\s+(OR\s+REPLACE\s+)?(PROCEDURE|FUNCTION|PACKAGE|TRIGGER))\b)/gi;
    let match;
    let lastIndex = 0;
  
    while ((match = regex.exec(sqlText)) !== null) {
      if (match.index > lastIndex) {
        blocks.push(sqlText.slice(lastIndex, match.index).trim());
      }
      lastIndex = match.index;
    }
    if (lastIndex < sqlText.length) {
      blocks.push(sqlText.slice(lastIndex).trim());
    }
  
    console.log("Raw SQL block count:", blocks.length);
  
    return blocks.filter(Boolean);
  };