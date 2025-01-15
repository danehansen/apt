import fetch from "node-fetch";
import isEqual from 'lodash/isEqual';

type Unit = {
  name: string;
  area: number;
  price: number;
  baths: number;
  available: string;
}

async function getResultsEndpointA(date: Date): Promise<Unit[]> {
  type EndpointUnit = {
    minimum_rent: string;
    baths: string;
    make_ready_date: string;
    name: string;
    sqft: number;
  }
  type EndpointResponse = {
    result: {
      units: EndpointUnit[];
    }
  }

  const startStr = dateToString(date);
  const endDate = new Date(new Date())
  endDate.setDate(endDate.getDate() + 365);
  const endStr = dateToString(endDate);
  return await getJson<string>(
    `https://www.essexapartmenthomes.com/EPT_Feature/PropertyManagement/Service/GetPropertyAvailabiltyByRange/513968/${startStr}/${endStr}`
  )
    .then((str: string) => {
      const response = JSON.parse(str) as EndpointResponse;
      return response.result.units.map((unit: EndpointUnit): Unit => {
        return {
          name: unit.name,
          area: unit.sqft,
          price: parseInt(unit.minimum_rent),
          baths: parseInt(unit.baths),
          available: new Date(unit.make_ready_date).toLocaleDateString(),
          // availability_date: new Date(unit.availability_date).toLocaleDateString(),
          // aging_days: unit.aging_days,
        };
      }).sort(sortResults);
    });
}

async function getResultsEndpointB(date: Date): Promise<Unit[]> {
  type EndpointFloorplan = {
    id: string;
    name: string;
    bathroom_count: number;
  }
  type Floorplan = {
    name: string;
    baths: number;
  }
  type EndpointUnit = {
    floor_plan_id: string;
    unit_number: string;
    area: number;
    price: number;
    available_on: string;
  }
  type EndpointResponse = {
    data: {
      floor_plans: EndpointFloorplan[];
      units: EndpointUnit[];
    }
  }

  const startStr = dateToString(date);
  return await getJson<EndpointResponse>(
    `https://sightmap.com/app/api/v1/910pdqolw2z/sightmaps/6757?enable_api=1&move_in_date=${startStr}`
  )
    .then(({ data }: EndpointResponse) => {
      const floorplans: Record<string, Floorplan> = {};
      data.floor_plans.forEach((floorplan: EndpointFloorplan) => {
        floorplans[floorplan.id] = {
          name: floorplan.name,
          baths: floorplan.bathroom_count,
        };
      })
      return data.units.map((unit: EndpointUnit): Unit => {
        const floorplan = floorplans[unit.floor_plan_id]
        return {
          name: unit.unit_number,
          area: unit.area,
          price: unit.price,
          baths: floorplan.baths,
          available: new Date(
            unit.available_on
          ).toLocaleDateString(),
        };
      }).sort(sortResults);
    });
}

async function getJson<T>(url: string): Promise<T> {
  return await fetch(url)
    .then((response) => {
      return response.json() as T;
    })
}

function sortResults(a: Unit, b: Unit): number {
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

function dateToString(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const date = new Date();
// date.setDate(date.getDate() - 365 * 1);

const resultsA = await getResultsEndpointA(date);
const resultsB = await getResultsEndpointB(date);

const areEqual = isEqual(resultsA, resultsB);
if (areEqual) {
  console.log(resultsA)
} else {
  console.log("unequal", { resultsA, resultsB })
}
