import fetch from "node-fetch";
import * as format from "@danehansen/format";
import nodemailer from "nodemailer";

function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

async function getResults() {
  const today = new Date();
  const startStr = dateToString(today);
  today.setDate(today.getDate() + 365);
  const endStr = dateToString(today);

  return fetch(
    `https://www.essexapartmenthomes.com/EPT_Feature/PropertyManagement/Service/GetPropertyAvailabiltyByRange/513968/${startStr}/${endStr}`
  )
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      const { result } = JSON.parse(response);

      // const floorplans = {};
      // result.floorplans.forEach((floorplan)=>{
      //   floorplans[floorplan.floorplan_id] = {
      //     name: floorplan.name,
      //     baths: parseInt(floorplan.baths),
      //   };
      // })
      const totalUnits = result.units.length;
      const units = [];
      result.units.forEach((unit) => {
        const u = {
          name: unit.name,
          sqft: unit.sqft,
          minimum_rent: format.default.dollars(parseInt(unit.minimum_rent)),
          baths: parseInt(unit.baths),
          availability_date: new Date(
            unit.availability_date
          ).toLocaleDateString(),
          make_ready_date: new Date(unit.make_ready_date).toLocaleDateString(),
          aging_days: unit.aging_days,
          // floorplan: floorplans[unit.floorplan_id],
        };
        if (u.sqft < 800) {
          return;
        }
        units.push(u);
      });

      units.sort((a, b) => {
        return b.name - a.name;
      });
      units.sort((a, b) => {
        return b.sqft - a.sqft;
      });

      return {
        totalUnits,
        units,
      };
    });
}

async function getResults2() {
  const today = new Date();
  const startStr = dateToString(today);
  today.setDate(today.getDate() + 365);
  const endStr = dateToString(today);

  return fetch(
    `https://sightmap.com/app/api/v1/910pdqolw2z/sightmaps/6757?enable_api=1&move_in_date=${startStr}`
  )
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      const { data } = response;
      const { units: _units, floor_plans } = data;

      const floorplans = {};
      floor_plans.forEach((floorplan) => {
        floorplans[floorplan.id] = {
          name: floorplan.name,
          baths: floorplan.bathroom_count,
        };
      })
      const totalUnits = _units.length;
      const units = [];
      _units.forEach((unit) => {
        const id = unit.floor_plan_id
        const floorplan = floorplans[id]
        const u = {
          name: unit.unit_number,
          sqft: unit.area,
          minimum_rent: format.default.dollars(unit.price),
          baths: floorplan.baths,
          make_ready_date: new Date(
            unit.available_on
          ).toLocaleDateString(),
          // floorplan,
        };
        if (u.sqft < 800) {
          return;
        }
        units.push(u);
      });
      units.sort((a, b) => {
        return b.name - a.name;
      });
      units.sort((a, b) => {
        return b.sqft - a.sqft;
      });
      const result = {
        totalUnits,
        units,
      }

      return result;
    });
}

async function emailResults({ units, totalUnits }) {
  units = units.map(
    ({
      name,
      sqft,
      minimum_rent,
      baths,
      make_ready_date,
      availability_date,
      aging_days,
    }) => {
      let result = `${name}\nsqft: ${sqft}\n${minimum_rent}\nbaths: ${baths}`
      // result += `\navailable: ${availability_date}`;
      result += `\nmake_ready_date: ${make_ready_date}`
      // result += `\naging_days: ${aging_days}`
      return result;
    }
  );
  units = units.join("\n\n");

  // const testAccount = await nodemailer.createTestAccount();

  // const transporter = nodemailer.createTransport({
  //   host: "smtp.ethereal.email",
  //   port: 587,
  //   secure: false, // true for 465, false for other ports
  //   auth: {
  //     user: testAccount.user,
  //     pass: testAccount.pass,
  //   },
  // });

  // const info = await transporter.sendMail({
  //   from: '"Fred Foo 👻" <foo@example.com>',
  //   to: "dane@danehansen.com",
  //   subject: `PE Lofts Availability: total ${totalUnits}`,
  //   text: units,
  //   // html: "<b>Hello world?</b>",
  // });

  // console.log("Message sent: %s", info.messageId);

  console.log(`total: ${totalUnits}\n`);
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

// emailResults(await getResults());
emailResults(await getResults2());
