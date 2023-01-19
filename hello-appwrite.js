const dotenv = require("dotenv")
dotenv.config()
const {
  DB_ENDPOINT,
  DB_PROJECT,
  DB_API_KEY
} = process.env

const dbId = 'new-apartments-db'
const collectionId = 'apartments'

const sdk = require('node-appwrite');
// Init SDK
const client = new sdk.Client();
const databases = new sdk.Databases(client);
client
  .setEndpoint(DB_ENDPOINT) // Your API Endpoint
  .setProject(DB_PROJECT)                // Your project ID
  .setKey(DB_API_KEY);         // Your secret API key

const getApartmentListings = async () => {
  // your web crawling code here
  return []
}

//https://appwrite.io/docs/server/databases?sdk=nodejs-default#databasesListDocuments
const getOldApartments = async () => {
  const oldApartments = await databases.listDocuments(dbId, collectionId);
  console.log(oldApartments)
}


//https://appwrite.io/docs/server/databases?sdk=nodejs-default#databasesCreateDocument
const saveNewListings = async(listings) => {
  for(let apt of listings){
    await saveSingleList(apt)
  }
}

const saveSingleListing = async(listing) => {
  const payload = {
    name:"batcave",
    sqft:"stuff",
    minimum_rent:"1000",
    baths:"two",
    make_ready_date:"shitshow",
    availability_date: "never",
    aging_days:"4001",
  }
  const result = await databases.createDocument(dbId, collectionId, sdk.ID.unique(), payload);
}

const findNewApartments = async () => {
  const apartmentListings = await getApartmentListings()
  const oldApartments = await getOldApartments()

  let newListings = []

  apartmentListings.forEach(newApt => {
  let matched = false
  oldApartments.forEach(oldApt => {
    if (newApt.name === oldApt.name) {
      matched = true
    }
  });
  if (!matched) {
    newListings.push(newApt)
  }
});

if (newListings.length > 0) {
  //send email, then
  await saveNewListings(newListings)
}


}

findNewApartments()
// saveSingleListing()