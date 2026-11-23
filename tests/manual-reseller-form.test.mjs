import test from "node:test";
import assert from "node:assert/strict";
import { applyPostalAddress } from "../lib/reseller-form-draft.mjs";

test("CEP lookup fills location without overwriting house number or complement", () => {
  const draft = {postalCode:"01310-100",street:"",number:"25",complement:"Casa 2",district:"",city:"",state:""};
  assert.deepEqual(applyPostalAddress(draft,{street:"Avenida Paulista",district:"Bela Vista",city:"São Paulo",state:"SP"}),{
    postalCode:"01310-100",street:"Avenida Paulista",number:"25",complement:"Casa 2",district:"Bela Vista",city:"São Paulo",state:"SP",
  });
});

test("partial CEP lookup keeps manually typed street and neighborhood", () => {
  const draft = {street:"Rua já conferida",district:"Meu bairro",city:"",state:""};
  assert.deepEqual(applyPostalAddress(draft,{street:"",district:"",city:"Santos",state:"SP"}),{
    street:"Rua já conferida",district:"Meu bairro",city:"Santos",state:"SP",
  });
});
