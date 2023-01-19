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
        return b.sqft - a.sqft;
      });

      return {
        totalUnits,
        units,
      };
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
      return `${name}\nsqft: ${sqft}\n${minimum_rent}\nbaths: ${baths}\navailable: ${availability_date}\nmake_ready_date${make_ready_date}\naging_days: ${aging_days}`;
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

emailResults(await getResults());
