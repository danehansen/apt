import fetch from "node-fetch";
import * as format from "@danehansen/format";
import nodemailer from "nodemailer";

async function getResultsEndpointA() {
  const today = new Date();
  const startStr = dateToString(today);
  today.setDate(today.getDate() + 365);
  const endStr = dateToString(today);
  return await getJson(
    `https://www.essexapartmenthomes.com/EPT_Feature/PropertyManagement/Service/GetPropertyAvailabiltyByRange/513968/${startStr}/${endStr}`
  )
    .then((response) => {
      return JSON.parse(response).result.units.map((unit) => {
        return {
          name: unit.name,
          area: unit.sqft,
          price: format.default.dollars(parseInt(unit.minimum_rent)),
          baths: parseInt(unit.baths),
          available: new Date(unit.make_ready_date).toLocaleDateString(),
          // availability_date: new Date(unit.availability_date).toLocaleDateString(),
          // aging_days: unit.aging_days,
        };
      }).sort(sortResults);
    });
}

async function getResultsEndpointB() {
  const startStr = dateToString(new Date());
  return await getJson(
    `https://sightmap.com/app/api/v1/910pdqolw2z/sightmaps/6757?enable_api=1&move_in_date=${startStr}`
  )
    .then(({ data }) => {
      const floorplans = {};
      data.floor_plans.forEach((floorplan) => {
        floorplans[floorplan.id] = {
          name: floorplan.name,
          baths: floorplan.bathroom_count,
        };
      })
      return data.units.map((unit) => {
        const floorplan = floorplans[unit.floor_plan_id]
        return {
          name: unit.unit_number,
          area: unit.area,
          price: format.default.dollars(unit.price),
          baths: floorplan.baths,
          available: new Date(
            unit.available_on
          ).toLocaleDateString(),
        };
      }).sort(sortResults);
    });
}

async function getJson(url) {
  return await fetch(url)
    .then((response) => {
      return response.json();
    })
}

function sortResults(a, b) {
  if (b.area !== a.area) {
    return b.area - a.area;
  }
  if (b.name < a.name) {
    return 1;
  }
  if (b.name > a.name) {
    return -1;
  }
  return 0;
}

function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

async function emailResults(units) {
  units = units.map(
    ({
      name,
      area,
      price,
      baths,
      available,
    }) => {
      return `${name}\narea: ${area}\n${price}\nbaths: ${baths}\navailable: ${available}`
    }
  );
  units = units.join("\n\n");

  console.log(`total: ${units.length}\n`);
  console.log(units);

  const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });
  transporter.sendMail(
    {
      from: "sender@example.com",
      to: "dane@danehansen.com",
      subject: `PE Lofts Availability: total ${totalUnits}`,
      text: units,
    },
    (err, info) => {
      console.log(info.envelope);
      console.log(info.messageId);
    }
  );

  console.log('done.');
}

const resultsA = await getResultsEndpointA();
const resultsB = await getResultsEndpointB();

// emailResults(resultsA);
// emailResults(resultsB);
console.log({ resultsA, resultsB })
