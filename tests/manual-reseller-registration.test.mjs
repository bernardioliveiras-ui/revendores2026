import test from "node:test";
import assert from "node:assert/strict";
import { validateManualReseller } from "../lib/reseller-registration.mjs";

const normalizeEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? v.trim().toLowerCase() : null;
const isAdminEmail = (v) => v === "admin@example.com";
const valid = {
  name: "  Maria   Silva  ", email: " MARIA@EXAMPLE.COM ", phone: "(11) 98888-7777",
  cpfCnpj: "529.982.247-25", postalCode: "01310-100", street: "Avenida Paulista",
  number: "100", complement: "Sala 7", district: "Bela Vista", city: "São Paulo", state: "sp",
};
const validate = (v) => validateManualReseller(v, normalizeEmail, isAdminEmail);

test("manual registration canonicalizes all address fields and CPF", () => {
  assert.deepEqual(validate(valid), {value: {
    name: "Maria Silva", email: "maria@example.com", phone: "11988887777", cpfCnpj: "52998224725",
    postalCode: "01310100", street: "Avenida Paulista", number: "100", complement: "Sala 7",
    district: "Bela Vista", city: "São Paulo", state: "SP", initialBoxes: 0,
  }});
});

test("manual registration accepts an actual starting stock of 50 boxes", () => {
  assert.equal(validate({...valid,initialBoxes:50}).value?.initialBoxes,50);
});

test("manual registration rejects malformed, negative or overflowing stock", () => {
  for (const initialBoxes of [-1,1.5,"10",null,Number.NaN,2147483648]) {
    const result=validate({...valid,initialBoxes});
    assert.match(result.error||"",/estoque/i,String(initialBoxes));
  }
});

test("CNPJ is supported and optional complement defaults to blank", () => {
  const response = validate({...valid,cpfCnpj:"11.222.333/0001-81",complement:""});
  assert.equal(response.value?.cpfCnpj, "11222333000181");
  assert.equal(response.value?.complement, "");
});

test("invalid CPF or CNPJ cannot enter a manual reseller profile", () => {
  for (const cpfCnpj of ["111.111.111-11", "52998224724", "11.222.333/0001-82", "123", ""])
    assert.ok(validate({...valid,cpfCnpj}).error, cpfCnpj);
});

test("rejects absent address, invalid CEP/UF, admin email or malformed phone", () => {
  for (const patch of [
    {street:""}, {number:" "}, {district:""}, {city:""}, {postalCode:"001"},
    {state:"XX"}, {email:"admin@example.com"}, {phone:"1234"}, {name:"A"},
  ]) assert.ok(validate({...valid,...patch}).error, JSON.stringify(patch));
});
