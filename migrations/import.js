const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const importData = async () => {
  // Load the workbook
  const workbook = xlsx.readFile('./dbData.xlsx');

  // Define sheet names and their corresponding models
  const sheetsToModels = {
    'OrderHeader(oh)': 'orderHeader',
    'OrderRows(orp)': 'orderRows',
    'ItemAll(ar)': 'itemAll',
    'PickAreas(gatx)': 'pickAreas'
  };

  // Map each sheet to the corresponding data model structure
  for (const [sheetName, modelName] of Object.entries(sheetsToModels)) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.warn(`Sheet ${sheetName} not found in workbook.`);
      continue;
    }

    const sheetData = xlsx.utils.sheet_to_json(worksheet);

    // Format data based on model
    const formattedData = sheetData.map((row) => {
      switch (modelName) {
        case 'orderHeader':
          return {
            
            plantDate: new Date(row['PlantDate']),
            orderNr: row['OrderNr']
          };
        case 'orderRows':
          return {
            
            orderNr: row['OrderNr'],
            itemNumber: row['ItemNumber'],
            quantity: row['Quantity']
          };
        case 'itemAll':
          return {
            
            itemNumber: row['Item Number'],
            itemDescription: row['ItemDescription'],
            pickAreaNr: row['PickAreaNr'],
            uom: row['UOM'],
            smallText: row['SmallText']
          };
        case 'pickAreas':
          return {
            
            pickAreaNr: row['PickAreaNr'],
            pickAreaName: row['PickAreaName']
          };
        default:
          return {};
      }
    });

    // Insert data into MongoDB for each model
    if (formattedData.length > 0) {
      await prisma[modelName].createMany({ data: formattedData });
      console.log(`Data imported successfully for ${modelName}`);
    }
  }

  console.log('Data import complete');
};

importData()
  .then(() => prisma.$disconnect())
  .catch(error => {
    console.error('Error during data import:', error);
    prisma.$disconnect();
  });